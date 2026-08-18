"""Integration tests for student CRUD and search."""

import pytest


@pytest.mark.asyncio
async def test_create_student(client, admin_headers, cse_department, academic_year):
    resp = await client.post("/api/v1/students", json={
        "register_number": "REG001",
        "application_number": "APP001",
        "name": "Test Student",
        "gender": "MALE",
        "district": "Chennai",
        "community": "OC",
        "cutoff_score": 190.0,
        "admission_status": "ADMITTED",
        "department_id": cse_department.id,
        "academic_year_id": academic_year.id,
    }, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["register_number"] == "REG001"
    assert data["gender"] == "MALE"
    assert data["admission_status"] == "ADMITTED"


@pytest.mark.asyncio
async def test_get_student(client, admin_headers, cse_department, academic_year):
    # create one first
    create = await client.post("/api/v1/students", json={
        "register_number": "REG002", "application_number": "APP002",
        "name": "John Doe", "gender": "MALE", "district": "Salem",
        "community": "BC", "cutoff_score": 175.0, "admission_status": "APPLIED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }, headers=admin_headers)
    sid = create.json()["data"]["id"]
    resp = await client.get(f"/api/v1/students/{sid}", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["name"] == "John Doe"
    assert data["department"]["code"] == "CSE"


@pytest.mark.asyncio
async def test_update_student(client, admin_headers, cse_department, academic_year):
    create = await client.post("/api/v1/students", json={
        "register_number": "REG003", "application_number": "APP003",
        "name": "Jane Doe", "gender": "FEMALE", "cutoff_score": 180.0,
        "admission_status": "APPLIED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }, headers=admin_headers)
    sid = create.json()["data"]["id"]
    resp = await client.patch(f"/api/v1/students/{sid}", json={
        "name": "Jane Updated", "admission_status": "ADMITTED",
    }, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["name"] == "Jane Updated"
    assert resp.json()["data"]["admission_status"] == "ADMITTED"


@pytest.mark.asyncio
async def test_delete_student(client, admin_headers, cse_department, academic_year):
    create = await client.post("/api/v1/students", json={
        "register_number": "REG004", "application_number": "APP004",
        "name": "Delete Me", "gender": "MALE", "cutoff_score": 150.0,
        "admission_status": "APPLIED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }, headers=admin_headers)
    sid = create.json()["data"]["id"]
    resp = await client.delete(f"/api/v1/students/{sid}", headers=admin_headers)
    assert resp.status_code == 200

    # verify gone
    resp2 = await client.get(f"/api/v1/students/{sid}", headers=admin_headers)
    assert resp2.status_code == 404


@pytest.mark.asyncio
async def test_search_students(client, admin_headers, cse_department, academic_year):
    await client.post("/api/v1/students", json={
        "register_number": "REG010", "application_number": "APP010",
        "name": "Alice Smith", "gender": "FEMALE", "district": "Coimbatore",
        "community": "BC", "cutoff_score": 195.0, "admission_status": "ADMITTED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }, headers=admin_headers)
    await client.post("/api/v1/students", json={
        "register_number": "REG011", "application_number": "APP011",
        "name": "Bob Jones", "gender": "MALE", "district": "Chennai",
        "community": "OC", "cutoff_score": 170.0, "admission_status": "APPLIED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }, headers=admin_headers)

    resp = await client.get("/api/v1/students/search?q=Alice", headers=admin_headers)
    assert resp.status_code == 200
    rows = resp.json()["data"]
    assert len(rows) >= 1
    assert rows[0]["name"] == "Alice Smith"

    # column filter
    resp2 = await client.get("/api/v1/students/search?community=OC", headers=admin_headers)
    assert resp2.status_code == 200
    for row in resp2.json()["data"]:
        assert row["community"] == "OC"


@pytest.mark.asyncio
async def test_duplicate_student_forbidden(client, admin_headers, cse_department, academic_year):
    base = {
        "register_number": "REG005", "application_number": "APP005",
        "name": "Dup", "gender": "MALE", "admission_status": "APPLIED",
        "department_id": cse_department.id, "academic_year_id": academic_year.id,
    }
    await client.post("/api/v1/students", json=base, headers=admin_headers)
    resp = await client.post("/api/v1/students", json=base, headers=admin_headers)
    assert resp.status_code == 409  # duplicate


@pytest.mark.asyncio
async def test_create_student_with_academic_details(client, admin_headers, cse_department, academic_year):
    resp = await client.post("/api/v1/students", json={
        "register_number": "REG007", "application_number": "APP007",
        "name": "Scholar", "gender": "MALE", "cutoff_score": 200.0,
        "admission_status": "ADMITTED",
        "department_id": cse_department.id,
        "academic_year_id": academic_year.id,
        "academic_detail": {
            "sslc_year": 2022, "sslc_percentage": 96.5,
            "hsc_year": 2024, "hsc_percentage": 97.0,
            "maths_mark": 98, "physics_mark": 95, "chemistry_mark": 96,
        },
        "admission_detail": {
            "fee_paid": True, "fee_amount": 50000.0, "joined": True,
        },
    }, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["academic_detail"]["sslc_percentage"] == 96.5
    assert data["admission_detail"]["fee_paid"] is True