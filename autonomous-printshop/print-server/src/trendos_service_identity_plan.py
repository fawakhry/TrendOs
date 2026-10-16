"""AP-301: plan a restricted TrendOS service reader using FAKE claims only.

Owner authorized preparation, NOT provisioning any production identity,
reusing Diaa credentials, reading GitHub secrets or contacting the API.

This module never performs authentication, network requests, filesystem I/O,
token issuance, user creation, or production role changes. It does NOT define
an existing server-side role: "trendosshop_order_reader" is a proposed alias.
"""
from __future__ import annotations

from dataclasses import dataclass

from src.trendos_service_scope_gate import (
    STARTER_CATALOG, ServiceSpec,
)


class ServiceIdentityPlanError(RuntimeError):
    """Fixed, non-sensitive qualification error code only."""


@dataclass(frozen=True)
class ServiceIdentityPlan:
    """Desired permissions only; NOT evidence that a backend role exists."""
    alias: str
    service_codes: tuple[str, ...]
    allowed_screens: tuple[str, ...]
    allowed_departments: tuple[str, ...]
    allowed_actions: tuple[str, ...]


DEFAULT_PLAN = ServiceIdentityPlan(
    alias="trendosshop_order_reader",  # proposed local alias, not an account
    service_codes=("print", "laser"),
    allowed_screens=("print", "laser"),
    allowed_departments=("طباعة", "ليزر"),
    allowed_actions=("orders.read",),
)


def _exact_unique_strings(values: object, expected: tuple[str, ...]) -> bool:
    return (
        type(values) is list
        and len(values) == len(expected)
        and all(type(v) is str for v in values)
        and len(values) == len(set(values))
        and set(values) == set(expected)
    )


def validate_proposed_plan(
    plan: ServiceIdentityPlan,
    *, catalog: dict[str, ServiceSpec] | None = None,
) -> None:
    """Check that requested future services have been registered explicitly.

    New services may share a qualified screen+department. A new screen cannot
    become trusted merely by entering a service name in the catalog.
    """
    if catalog is None:
        catalog = STARTER_CATALOG
    if (
        type(plan) is not ServiceIdentityPlan
        or type(plan.alias) is not str or plan.alias != "trendosshop_order_reader"
        or type(plan.service_codes) is not tuple or not plan.service_codes
        or len(plan.service_codes) != len(set(plan.service_codes))
        or any(type(s) is not str or s not in catalog for s in plan.service_codes)
        or type(plan.allowed_screens) is not tuple
        or type(plan.allowed_departments) is not tuple
        or type(plan.allowed_actions) is not tuple
        or plan.allowed_actions != ("orders.read",)
    ):
        raise ServiceIdentityPlanError("AP301_INVALID_DESIRED_POLICY")
    approved_specs = [catalog[c] for c in plan.service_codes]
    if any(type(spec) is not ServiceSpec for spec in approved_specs):
        raise ServiceIdentityPlanError("AP301_INVALID_CATALOG")
    requested_screen_set = set(plan.allowed_screens)
    requested_dept_set = set(plan.allowed_departments)
    if (
        not requested_screen_set
        or len(requested_screen_set) != len(plan.allowed_screens)
        or len(requested_dept_set) != len(plan.allowed_departments)
        or any(type(s) is not str for s in plan.allowed_screens)
        or any(type(d) is not str for d in plan.allowed_departments)
        or requested_screen_set != {sp.screen for sp in approved_specs}
        or requested_dept_set != {sp.department for sp in approved_specs}
    ):
        raise ServiceIdentityPlanError("AP301_SCOPE_MISMATCH")
    for screen in requested_screen_set:
        if len({sp.department for sp in approved_specs if sp.screen == screen}) != 1:
            raise ServiceIdentityPlanError("AP301_SHARED_SCREEN_NOT_QUALIFIED")


def qualify_fake_account_grant(
    grant: dict,
    *, plan: ServiceIdentityPlan = DEFAULT_PLAN,
    catalog: dict[str, ServiceSpec] | None = None,
) -> dict:
    """Check a FAKE proposed grant's least privilege, returning NO-GO always.

    This function takes no live employee credentials and intentionally never
    returns a boolean that could be used as a real authorization decision.
    A backend role with this exact scope has NOT been implemented/verified.
    """
    validate_proposed_plan(plan, catalog=catalog)
    expected_keys = {
        "fixtureKind", "subject", "identityKind", "screens", "departments",
        "allowedActions", "canWriteOrders", "canAccessFinance",
        "canManageUsers", "canPrint", "canReadCustomerDirectory",
    }
    if type(grant) is not dict or set(grant) != expected_keys:
        raise ServiceIdentityPlanError("AP301_GRANT_SHAPE_DENIED")
    if grant["fixtureKind"] != "SYNTHETIC_ONLY":
        raise ServiceIdentityPlanError("AP301_REAL_CREDENTIALS_FORBIDDEN")
    if (
        type(grant["subject"]) is not str or
        grant["subject"] != "FAKE_TRENDOSSHOP_READER" or
        type(grant["identityKind"]) is not str or
        grant["identityKind"] != "dedicated_service_reader"
    ):
        raise ServiceIdentityPlanError("AP301_IDENTITY_NOT_DEDICATED")
    if (
        not _exact_unique_strings(grant["screens"], plan.allowed_screens)
        or not _exact_unique_strings(grant["departments"], plan.allowed_departments)
        or not _exact_unique_strings(grant["allowedActions"], plan.allowed_actions)
    ):
        raise ServiceIdentityPlanError("AP301_EXCESS_PERMISSIONS")
    for key in (
        "canWriteOrders", "canAccessFinance", "canManageUsers",
        "canPrint", "canReadCustomerDirectory",
    ):
        if grant[key] is not False:
            raise ServiceIdentityPlanError("AP301_FORBIDDEN_CAPABILITY")

    return {
        "ok": True,
        "mode": "AP301_FAKE_SERVICE_ACCOUNT_POLICY_CHECK",
        "requestedServiceCount": len(plan.service_codes),
        "requestedScreenCount": len(plan.allowed_screens),
        "readActionCount": 1,
        "mockExactScopeMatch": True,
        "realServiceIdentityCreated": False,
        "realBackendRoleExistsVerified": False,
        "realPermissionsVerified": False,
        "liveOrdersRead": False,
        "credentialValuesAccessed": False,
        "externalRequestsMade": False,
        "ubuntuChanged": False,
        "productionAuthorizationAllowed": False,
    }


def example_fake_grant() -> dict:
    """Static synthetic-only fixture; does not read from environment."""
    return {
        "fixtureKind": "SYNTHETIC_ONLY",
        "subject": "FAKE_TRENDOSSHOP_READER",
        "identityKind": "dedicated_service_reader",
        "screens": ["print", "laser"],
        "departments": ["طباعة", "ليزر"],
        "allowedActions": ["orders.read"],
        "canWriteOrders": False,
        "canAccessFinance": False,
        "canManageUsers": False,
        "canPrint": False,
        "canReadCustomerDirectory": False,
    }
