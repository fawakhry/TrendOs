"""Real disposable SQLite verification of Stage-only DO counter SQL literals.

No production D1/Cloudflare/identity data. Node tests separately exercise the
real DO class with a synthetic SQL adapter; this tests the *actual SQLite SQL*.
"""
import pathlib
import re
import sqlite3
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=(ROOT/"cloudflare-d1/customer-stage/login-throttle-v0.mjs").read_text()

def sql(name):
    match=re.search(r"const "+re.escape(name)+r"=(`([^\x60]+)`|'([^']+)');",SRC,re.S)
    if match is None:
        raise AssertionError("Missing actual Stage DO SQL literal: "+name)
    return match.group(2) or match.group(3)

CREATE=sql("SQL_CREATE")
SELECT=sql("SQL_SELECT")
UPSERT=sql("SQL_UPSERT")
PRUNE=sql("SQL_PRUNE")
WINDOW_MS=15*60*1000

class DurableStageSqlite(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(":memory:",isolation_level=None)
        self.db.execute(CREATE)
        self.now=1800000000000
    def tearDown(self):
        self.db.close()
    def try_login(self,code,ip,now=None):
        when=self.now if now is None else now
        window=when//WINDOW_MS
        keys=("portal:"+code,"ip:"+ip)
        limits=(5,30)
        self.db.execute("BEGIN IMMEDIATE")
        try:
            counts=[]
            for k in keys:
                row=self.db.execute(SELECT,(k,)).fetchone()
                counts.append(row[1] if row and row[0]==window else 0)
            if any(count>=limit for count,limit in zip(counts,limits)):
                self.db.execute("COMMIT")
                return False
            for key,count in zip(keys,counts):
                self.db.execute(UPSERT,(key,window,count+1,when))
            self.db.execute(PRUNE,(when-24*60*60*1000,))
            self.db.execute("COMMIT")
            return True
        except BaseException:
            self.db.execute("ROLLBACK")
            raise
    def hits(self,key):
        row=self.db.execute("SELECT hits FROM customer_login_rate_stage_v0 WHERE rate_key=?",(key,)).fetchone()
        return row[0] if row else None
    def test_schema_and_original_upsert_sql(self):
        self.assertIn("PRIMARY KEY",CREATE)
        self.assertIn("ON CONFLICT",UPSERT)
        self.assertIn("excluded.hits",UPSERT)
        self.assertIn("last_seen_ms",PRUNE)
        self.assertTrue(self.try_login("a"*64,"b"*64))
        self.assertEqual(self.hits("portal:"+"a"*64),1)
        self.assertEqual(self.hits("ip:"+"b"*64),1)
    def test_portal_cap_and_no_partial_update_on_denial(self):
        for _ in range(5):
            self.assertTrue(self.try_login("a"*64,"b"*64))
        self.assertFalse(self.try_login("a"*64,"b"*64))
        self.assertFalse(self.try_login("a"*64,"c"*64))
        self.assertEqual(self.hits("portal:"+"a"*64),5)
        self.assertIsNone(self.hits("ip:"+"c"*64))
    def test_ip_cap_across_unique_identities(self):
        for n in range(30):
            self.assertTrue(self.try_login(format(n,"064x"),"b"*64))
        self.assertFalse(self.try_login("f"*64,"b"*64))
        self.assertEqual(self.hits("ip:"+"b"*64),30)
        self.assertIsNone(self.hits("portal:"+"f"*64))
    def test_window_reset_and_obsolete_row_cleanup(self):
        key="a"*64
        self.assertTrue(self.try_login(key,"b"*64))
        later=self.now+WINDOW_MS*3
        self.assertTrue(self.try_login(key,"b"*64,later))
        self.assertEqual(self.hits("portal:"+key),1)
        self.assertTrue(self.try_login("c"*64,"d"*64,self.now+25*60*60*1000))
        self.assertIsNone(self.hits("portal:"+key))
    def test_atomic_transaction_rollback_if_ip_write_fails(self):
        self.db.executescript("""
        CREATE TRIGGER deny_ip_for_test BEFORE INSERT ON customer_login_rate_stage_v0
        WHEN NEW.rate_key LIKE 'ip:%'
        BEGIN SELECT RAISE(ABORT, 'synthetic ip storage failure'); END;
        """)
        with self.assertRaises(sqlite3.IntegrityError):
            self.try_login("a"*64,"b"*64)
        self.assertIsNone(self.hits("portal:"+"a"*64))
        self.assertIsNone(self.hits("ip:"+"b"*64))
    def test_no_unverified_write_after_injected_durable_failure(self):
        self.db.execute("DROP TABLE customer_login_rate_stage_v0")
        with self.assertRaises(sqlite3.OperationalError):
            self.try_login("a"*64,"b"*64)
        self.assertIsNone(self.db.execute(
          "SELECT name FROM sqlite_master WHERE name='customer_login_rate_stage_v0'"
        ).fetchone())

if __name__=="__main__":
    unittest.main()
