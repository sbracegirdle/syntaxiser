"""Behavior checks beyond successful example execution."""
import asyncio
import httpx
import pytest
from pydantic import BaseModel, Field, ValidationError

class Order(BaseModel):
    quantity: int = Field(gt=0)

@pytest.mark.parametrize("quantity", [0, -1, "3", None])
def test_strict_validation_rejects_invalid_quantity(quantity):
    with pytest.raises(ValidationError):
        Order.model_validate({"quantity": quantity}, strict=True)

def test_json_model_roundtrip():
    order = Order(quantity=3)
    assert Order.model_validate_json(order.model_dump_json()) == order

def test_async_request_and_overall_deadline():
    async def run():
        async def respond(request):
            if request.url.path == "/slow":
                await asyncio.Event().wait()
            return httpx.Response(200, json={"ready": True})
        async with httpx.AsyncClient(transport=httpx.MockTransport(respond)) as client:
            response = await client.get("https://example.test/ready")
            response.raise_for_status()
            assert response.json() == {"ready": True}
            with pytest.raises(TimeoutError):
                async with asyncio.timeout(0.02):
                    await client.get("https://example.test/slow")
        assert client.is_closed
    asyncio.run(run())

@pytest.fixture
def report_reader(monkeypatch):
    from pathlib import Path
    monkeypatch.syspath_prepend(str(Path(__file__).resolve().parents[1]))
    from tour import read_orders
    return read_orders

@pytest.mark.parametrize("csv_text, expected", [
    ("name,quantity\n", {}),
    ("name,quantity\ntea,1\ntea,2\ncoffee,4\n", {"coffee": 4, "tea": 3}),
])
def test_report_totals_and_order(report_reader, tmp_path, csv_text, expected):
    path = tmp_path / "orders.csv"
    path.write_text(csv_text, encoding="utf-8")
    result = report_reader(path)
    assert result == expected
    assert list(result) == sorted(expected)

@pytest.mark.parametrize("csv_text", ["name,quantity\ntea,0\n", "name,quantity\ntea,bad\n"])
def test_report_rejects_bad_rows(report_reader, tmp_path, csv_text):
    path = tmp_path / "orders.csv"
    path.write_text(csv_text, encoding="utf-8")
    with pytest.raises(ValueError, match="cannot read validated orders") as caught:
        report_reader(path)
    assert isinstance(caught.value.__cause__, ValidationError)

def test_report_missing_file(report_reader, tmp_path):
    with pytest.raises(ValueError) as caught:
        report_reader(tmp_path / "missing.csv")
    assert isinstance(caught.value.__cause__, FileNotFoundError)

@pytest.mark.parametrize("card_id", ["python-sqlite3-client-find", "python-sqlite3-client-named"])
def test_sql_companion_bindings(card_id):
    import json
    from pathlib import Path
    import sqlite3
    companions = json.loads((Path(__file__).resolve().parents[3] / "packs/sql-companions.json").read_text(encoding="utf-8"))
    card = next(card for card in companions["python"]["cards"] if card["id"] == card_id)
    namespace = {}
    exec(compile(card["code"], card_id, "exec"), namespace)
    connection = sqlite3.connect(":memory:")
    try:
        connection.execute("CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
        connection.executemany("INSERT INTO customers VALUES (?, ?)", [(1, "Ada"), (2, "O'Reilly")])
        if card_id.endswith("-find"):
            assert namespace["find_customer"](connection, 1) == "Ada"
            assert namespace["find_customer"](connection, 99) is None
        else:
            assert namespace["find_by_name"](connection, "O'Reilly") == [(2, "O'Reilly")]
            assert namespace["find_by_name"](connection, "' OR 1=1 --") == []
        assert connection.execute("SELECT COUNT(*) FROM customers").fetchone() == (2,)
    finally:
        connection.close()
