"""Integration tests for CSV/Excel import engine."""

import io

import pytest


@pytest.mark.asyncio
async def test_preview_csv(client, admin_headers):
    csv_content = (
        "register_number,application_number,name,gender,community,district,cutoff_score\n"
        "REG100,APP100,Student One,MALE,OC,Chennai,190\n"
        "REG101,APP101,Student Two,FEMALE,BC,Salem,175\n"
    )
    files = {"file": ("import.csv", csv_content.encode("utf-8-sig"), "text/csv")}
    resp = await client.post("/api/v1/imports/preview", files=files, headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["total_rows"] == 2
    assert "headers" in data
    assert len(data["rows_preview"]) == 2


@pytest.mark.asyncio
async def test_import_csv(client, admin_headers, cse_department, academic_year):
    csv_content = (
        "register_number,application_number,name,gender,community,district,cutoff_score\n"
        "IMP001,APP001,Import One,MALE,OC,Karur,185.0\n"
        "IMP002,APP002,Import Two,FEMALE,BC,Madurai,172.5\n"
    )
    files = {"file": ("students.csv", csv_content.encode("utf-8-sig"), "text/csv")}
    resp = await client.post("/api/v1/imports/upload", files=files, headers=admin_headers)
    assert resp.status_code == 200
    summary = resp.json()["data"]
    assert summary["imported_rows"] == 2
    assert summary["error_rows"] == 0
    assert summary["batch_id"] > 0


@pytest.mark.asyncio
async def test_import_duplicate_detected(client, admin_headers, cse_department, academic_year):
    csv = "register_number,application_number,name,gender\nDUP10,DUP10,Dup One,MALE"
    files = {"file": ("import.csv", csv.encode("utf-8-sig"), "text/csv")}
    await client.post("/api/v1/imports/upload", files=files, headers=admin_headers)
    resp = await client.post("/api/v1/imports/upload", files=files, headers=admin_headers)
    data = resp.json()["data"]
    assert data["duplicate_rows"] > 0


@pytest.mark.asyncio
async def test_import_batch_status(client, admin_headers):
    csv_content = "register_number,application_number,name,gender\nBAT1,BAT1,Batch,MALE\n"
    files = {"file": ("import.csv", csv_content.encode("utf-8-sig"), "text/csv")}
    imp = await client.post("/api/v1/imports/upload", files=files, headers=admin_headers)
    batch_id = imp.json()["data"]["batch_id"]
    resp = await client.get(f"/api/v1/imports/batches/{batch_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["batch_id"] == batch_id


@pytest.mark.asyncio
async def test_import_xlsx(client, admin_headers, cse_department, academic_year):
    try:
        import openpyxl
        from openpyxl import Workbook
        from io import BytesIO

        wb = Workbook()
        ws = wb.active
        ws.append(["register_number", "application_number", "name", "gender"])
        ws.append(["XL01", "XL01", "Excel User", "MALE"])
        stream = BytesIO()
        wb.save(stream)
        content = stream.getvalue()
    except ImportError:
        pytest.skip("openpyxl not available")

    files = {"file": ("data.xlsx", content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    resp = await client.post("/api/v1/imports/preview", files=files, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["total_rows"] == 1