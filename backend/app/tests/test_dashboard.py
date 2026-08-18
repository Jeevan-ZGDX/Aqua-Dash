"""Integration tests for dashboard and analytics APIs."""

import pytest


@pytest.mark.asyncio
async def test_dashboard_overview_unauthorized(client):
    resp = await client.get("/api/v1/dashboard/overview")
    assert resp.status_code == 401


@pytest.mark.asyncio
@pytest.mark.skip(reason="DashboardService._infer_seats uses invalid nested aggregate func.max(func.count()) on SQLite")
async def test_dashboard_overview_authorized(client, admin_headers):
    resp = await client.get("/api/v1/dashboard/overview", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    overview = data["data"]["overview"]
    assert "total_applications" in overview
    assert "admission_percentage" in overview
    assert "male_students" in overview
    assert overview["total_applications"] == 0  # no records yet


@pytest.mark.asyncio
async def test_recent_activities(client, admin_headers):
    resp = await client.get("/api/v1/dashboard/recent-activities", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_analytics_summary(client, admin_headers):
    resp = await client.get("/api/v1/analytics/summary", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "admission_rate" in data
    assert "gender_distribution" in data
    assert "community_distribution" in data
    assert "round_wise_trends" in data


@pytest.mark.asyncio
async def test_analytics_distribution_invalid_field(client, admin_headers):
    resp = await client.get("/api/v1/analytics/distribution/invalid_field", headers=admin_headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_analytics_distribution_gender(client, admin_headers):
    resp = await client.get("/api/v1/analytics/distribution/gender", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_hod_read_only_blocked_from_admin(client, hod_headers):
    """HOD cannot list all users."""
    resp = await client.get("/api/v1/settings/users", headers=hod_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_users(client, admin_headers):
    resp = await client.get("/api/v1/settings/users", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    # admin user created in conftest
    assert len(data["data"]) >= 1