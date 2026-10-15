"""Runnable editor contexts; use the locked playground dependencies."""
import asyncio
import csv as rows
import json
import logging
from pathlib import Path as FilePath

import httpx as web
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field, ValidationError

class Order(BaseModel):
    name: str
    quantity: int = Field(gt=0)

def read_orders(path: FilePath) -> dict[str, int]:
    totals: dict[str, int] = {}
    try:
        with path.open(newline="", encoding="utf-8") as stream:
            for row in rows.DictReader(stream, strict=True):
                order = Order.model_validate(row)
                totals[order.name] = totals.get(order.name, 0) + order.quantity
    except (OSError, UnicodeError, rows.Error, ValidationError) as error:
        raise ValueError("cannot read validated orders") from error
    return dict(sorted(totals.items()))

app = FastAPI()
@app.post("/items", response_model=Order, status_code=201)
def create_item(order: Order) -> Order:
    return order

async def local_request():
    transport = web.ASGITransport(app=app)
    async with web.AsyncClient(transport=transport, base_url="http://local.test", timeout=5.0) as client:
        response = await client.post("/items", json={"name": "tea", "quantity": 2})
        response.raise_for_status()
        assert response.json() == {"name": "tea", "quantity": 2}

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    totals = read_orders(FilePath(__file__).parent / "data/orders.csv")
    assert totals == {"coffee": 2, "tea": 4}
    print(json.dumps(totals))
    with TestClient(app) as client:
        assert client.post("/items", json={"name": "tea", "quantity": 0}).status_code == 422
    asyncio.run(local_request())
