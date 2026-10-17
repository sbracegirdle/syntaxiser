"""Runnable data-library cursor targets using only tiny local fixtures."""
from pathlib import Path
from tempfile import TemporaryDirectory
import numpy as np
import pandas as pd


def calibrate():
    readings = np.array([[1, 2], [3, 4]], dtype=np.float64)
    return np.multiply(readings, [10, 100])


def report(path):
    orders = pd.read_csv(path, dtype={"order_id": "Int64", "product": "string"})
    prices = pd.DataFrame({"product": ["tea"], "price": [3]})
    return pd.merge(orders, prices, on="product", validate="many_to_one").sort_values("order_id")


if __name__ == "__main__":
    print(calibrate().tolist())
    with TemporaryDirectory() as directory:
        path = Path(directory) / "orders.csv"
        path.write_text("order_id,product\n2,tea\n1,tea\n", encoding="utf-8")
        print(report(path)["order_id"].tolist())
