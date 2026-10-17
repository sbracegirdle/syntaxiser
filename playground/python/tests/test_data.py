"""Independent happy/boundary/rejection/recovery assertions on exact catalog code.

No hand-copied implementations: compile and execute each shipped card in an
isolated temporary working directory, then call its public task function.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parents[3]
CARDS = {card["id"]: card for card in json.loads((ROOT / "packs/python.json").read_text())["cards"]}
UNITS = json.loads((ROOT / "playground/python/data-evidence.json").read_text())

@pytest.fixture
def task(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    def load(card_id, name):
        namespace = {"__name__": "__catalog_test__"}
        exec(compile(CARDS[card_id]["code"], card_id, "exec"), namespace)
        return namespace[name]
    return load

def test_numpy_sensor_matrix(task):
    make = task("numpy-sensor-matrix", "sensor_matrix")
    result = make([[1, 2], [3, 4]])
    np.testing.assert_array_equal(result, [[1., 2.], [3., 4.]])
    assert result.dtype == np.dtype("float64") and result.shape == (2, 2)
    assert make(np.empty((0, 2))).shape == (0, 2)
    for bad in ([[1, "bad"]], [[1], [2, 3]], [1, 2], [[1, np.inf]], [[np.nan, 1]]):
        with pytest.raises(ValueError):
            make(bad)
    np.testing.assert_array_equal(make([[0, -2]]), [[0., -2.]])

def test_numpy_count_grid(task):
    make = task("numpy-count-grid", "count_grid")
    result = make(2, 3)
    assert result.dtype == np.dtype("int64")
    np.testing.assert_array_equal(result, [[0, 0, 0], [0, 0, 0]])
    result[1, 2] = 7
    assert result[1, 2] == 7 and result.sum() == 7
    assert make(0, 3).shape == (0, 3)
    with pytest.raises(ValueError):
        make(-1, 3)
    assert make(1, 0).shape == (1, 0)

def test_numpy_calibrate_view(task):
    calibrate = task("numpy-calibrate-view", "calibrate_window")
    source = np.array([1., 2., 3.])
    view = calibrate(source, 0, 2, 10)
    assert np.shares_memory(source, view)
    np.testing.assert_array_equal(source, [11, 12, 3])
    np.testing.assert_array_equal(view, [11, 12])
    assert calibrate(source, 1, 1, 100).size == 0
    for start, stop in [(-1, 2), (0, 4), (2, 1)]:
        with pytest.raises(IndexError):
            calibrate(source, start, stop, 1)
    np.testing.assert_array_equal(calibrate(source, 2, 3, -1), [2])

def test_numpy_isolate_selection(task):
    select = task("numpy-isolate-selection", "selected_samples")
    source = np.array([10, 20, 30], dtype=np.int64)
    sample = select(source, [2, 0])
    np.testing.assert_array_equal(sample, [30, 10])
    assert not np.shares_memory(source, sample)
    sample[0] = 99
    np.testing.assert_array_equal(source, [10, 20, 30])
    assert select(source, []).shape == (0,)
    with pytest.raises(IndexError):
        select(source, [3])
    np.testing.assert_array_equal(select(source, [-1]), [30])
    # Inspect the exact card's explicitly copied basic slice too.
    namespace = {}
    exec(compile(CARDS["numpy-isolate-selection"]["code"], "preview", "exec"), namespace)
    assert not np.shares_memory(namespace["source"], namespace["preview"])
    np.testing.assert_array_equal(namespace["source"], [10, 20, 30])

def test_numpy_scale_columns(task):
    scale = task("numpy-scale-columns", "scale_columns")
    source = np.array([[1., 2.], [3., 4.]])
    factors = np.array([10., 100.])
    result = scale(source, factors)
    np.testing.assert_array_equal(result, [[10, 200], [30, 400]])
    assert result.dtype == np.dtype("float64") and not np.shares_memory(source, result)
    np.testing.assert_array_equal(source, [[1, 2], [3, 4]])
    np.testing.assert_array_equal(factors, [10, 100])
    assert scale(np.empty((0, 2)), factors).shape == (0, 2)
    with pytest.raises(ValueError):
        scale(source, [1, 2, 3])
    with pytest.raises(ValueError):
        np.multiply(source, np.ones(3))  # actual broadcasting rejection, not just wrapper validation
    np.testing.assert_array_equal(scale(source, [1, 1]), source)

def test_numpy_price_table(task):
    quotes = task("numpy-price-table", "price_table")
    result = quotes([1, 3], [10, 20])
    np.testing.assert_array_equal(result, [[10, 20], [30, 60]])
    assert result.dtype == np.dtype("int64") and result.shape == (2, 2)
    assert quotes([], [10, 20]).shape == (0, 2)
    assert quotes([1], []).shape == (1, 0)
    for quantities, prices in [([-1], [2]), ([1], [-2]), ([[1]], [2])]:
        with pytest.raises(ValueError):
            quotes(quantities, prices)
    np.testing.assert_array_equal(quotes([0, 2], [3]), [[0], [6]])

def test_numpy_row_totals(task):
    total = task("numpy-row-totals", "row_totals")
    result = total([[1, 2], [3, 4]])
    np.testing.assert_array_equal(result, [3, 7])
    assert result.dtype == np.dtype("int64")
    assert total(np.empty((0, 2))).shape == (0,)
    np.testing.assert_array_equal(total(np.empty((2, 0))), [0, 0])
    for bad in ([[1, -2]], [1, 2]):
        with pytest.raises(ValueError):
            total(bad)
    np.testing.assert_array_equal(total([[0, 4]]), [4])

def test_numpy_observed_means(task):
    mean = task("numpy-observed-means", "observed_means")
    np.testing.assert_allclose(mean([[1, np.nan], [3, 6]]), [2, 6])
    assert np.isnan(mean(np.empty((0, 2)))).all()
    np.testing.assert_allclose(mean([[np.nan, 2], [np.nan, 4]]), [np.nan, 3], equal_nan=True)
    for bad in ([[1, np.inf]], [1, 2]):
        with pytest.raises(ValueError):
            mean(bad)
    result = mean([[0., 4.]])
    assert result.dtype == np.dtype("float64") and result.shape == (2,)
    np.testing.assert_allclose(result, [0, 4])

def test_pandas_read_orders(task, tmp_path):
    read = task("pandas-read-orders", "read_orders")
    path = tmp_path / "input.csv"
    def csv(text):
        path.write_text(text, encoding="utf-8")
        return read(path)
    result = csv('name,quantity\n"tea, green",2\ncoffee,\n')
    assert result["name"].tolist() == ["tea, green", "coffee"]
    assert result["quantity"].tolist()[0] == 2 and pd.isna(result.loc[1, "quantity"])
    assert str(result["quantity"].dtype) == "Int64" and str(result["name"].dtype) == "string"
    assert csv("name,quantity\n").empty
    for invalid in ["name,quantity\ntea,bad\n", "name,quantity\ntea,-1\n", "name,quantity\n,2\n", "name\ntea\n", "name,quantity\ntea,1.5\n"]:
        with pytest.raises((ValueError, TypeError)):
            csv(invalid)
    assert csv("name,quantity\ntea,0\n").loc[0, "quantity"] == 0

def test_pandas_clean_quantities(task):
    clean = task("pandas-clean-quantities", "clean_quantities")
    result = clean(pd.Series([" 2 ", "", None], index=["c", "a", "b"]))
    assert result.index.tolist() == ["c", "a", "b"]
    assert result.iloc[0] == 2 and result.iloc[1:].isna().all() and str(result.dtype) == "Int64"
    assert clean(pd.Series([], dtype="string")).empty
    for bad in ["oops", "-1", "1.5"]:
        with pytest.raises((ValueError, TypeError)):
            clean(pd.Series([bad]))
    assert clean(pd.Series(["0", "3"])).tolist() == [0, 3]

def test_pandas_select_active(task):
    select = task("pandas-select-active", "active_preview")
    source = pd.DataFrame({"quantity": pd.Series([2, 4, 6], dtype="Int64"), "active": pd.Series([True, pd.NA, False], dtype="boolean")})
    preview = select(source)
    assert preview.index.tolist() == [0] and preview["quantity"].tolist() == [2]
    preview.loc[0, "quantity"] = 99
    assert source.loc[0, "quantity"] == 2  # pinned pandas 3 Copy-on-Write
    assert select(source.iloc[:0]).empty
    assert select(source.assign(active=pd.Series([pd.NA] * 3, dtype="boolean"))).empty
    with pytest.raises(KeyError):
        select(source.drop(columns="active"))
    assert select(source).iloc[0, 0] == 2
    with pytest.raises(TypeError):
        bool(pd.NA)

def test_pandas_align_scores(task):
    attach = task("pandas-align-scores", "attach_scores")
    source = pd.DataFrame({"name": ["Ada", "Ben"]}, index=["a", "b"])
    result = attach(source, pd.Series([20, 10], index=["b", "a"]))
    assert result["score"].tolist() == [10, 20] and "score" not in source
    result.loc["a", "name"] = "Changed"
    assert source.loc["a", "name"] == "Ada"
    assert attach(source.iloc[:0], pd.Series([], dtype="Int64")).empty
    for scores in [pd.Series([1], index=["a"]), pd.Series([1, 2], index=["a", "a"]), pd.Series([1, 2], index=["a", "c"])]:
        with pytest.raises(ValueError):
            attach(source, scores)
    with pytest.raises(ValueError):
        attach(source.set_axis(["a", "a"]), pd.Series([1], index=["a"]))
    assert attach(source, pd.Series([3, 4], index=["a", "b"]))["score"].tolist() == [3, 4]

def orders():
    return pd.DataFrame({"name": pd.Series(["tea", "coffee", "tea"], dtype="string"), "quantity": pd.Series([2, pd.NA, 3], dtype="Int64")})

def test_pandas_group_totals(task):
    group = task("pandas-group-totals", "group_totals")
    source = orders()
    result = group(source)
    assert result["name"].tolist() == ["coffee", "tea"]
    assert pd.isna(result.loc[0, "total"]) and result.loc[1, "total"] == 5
    assert str(result["total"].dtype) == "Int64"
    assert group(source.iloc[:0]).empty
    with pytest.raises(ValueError):
        group(source.assign(name=pd.NA))
    assert group(source.iloc[[2, 0]])["total"].tolist() == [5]
    pd.testing.assert_frame_equal(source, orders())

def test_pandas_group_quality(task):
    report = task("pandas-group-quality", "quality_report")
    source = pd.DataFrame({"region": pd.Series(["west", "west", pd.NA], dtype="string"), "reading": pd.Series([1, pd.NA, 2], dtype="Int64")})
    result = report(source)
    assert result["rows"].tolist() == [2, 1] and result["known"].tolist() == [1, 1]
    assert result.loc[0, "region"] == "west" and pd.isna(result.loc[1, "region"])
    assert report(source.iloc[:0]).empty
    with pytest.raises(ValueError):
        report(source.assign(reading=-1))
    recovered = report(source.assign(reading=pd.Series([pd.NA] * 3, dtype="Int64")))
    assert recovered["known"].tolist() == [0, 0]

def test_pandas_join_products(task):
    join = task("pandas-join-products", "enrich_orders")
    left = pd.DataFrame({"order_id": [2, 1], "product": ["tea", "tea"]})
    right = pd.DataFrame({"product": ["tea"], "price": [3]})
    result = join(left, right)
    assert result["order_id"].tolist() == [1, 2] and result["price"].tolist() == [3, 3]
    assert join(left.iloc[:0], right).empty
    with pytest.raises(pd.errors.MergeError):
        join(left, pd.concat([right, right]))
    for invalid in [left.assign(product=pd.NA), left.assign(product="unknown"), left.assign(order_id=1)]:
        with pytest.raises(ValueError):
            join(invalid, right)
    with pytest.raises(ValueError):
        join(left, right.assign(product=pd.NA))
    assert join(left, right)["price"].sum() == 6
    assert left["order_id"].tolist() == [2, 1] and right["price"].tolist() == [3]

def test_pandas_reconcile_ids(task):
    reconcile = task("pandas-reconcile-ids", "reconcile_ids")
    left, right = pd.DataFrame({"id": [2, 1]}), pd.DataFrame({"id": [2, 3]})
    result = reconcile(left, right)
    assert result["id"].tolist() == [1, 2, 3]
    assert result["_merge"].tolist() == ["left_only", "both", "right_only"]
    assert reconcile(left.iloc[:0], right.iloc[:0]).empty
    for bad_left, bad_right in [(pd.concat([left, left]), right), (left, pd.concat([right, right]))]:
        with pytest.raises(pd.errors.MergeError):
            reconcile(bad_left, bad_right)
    with pytest.raises(ValueError):
        reconcile(left.assign(id=pd.NA), right)
    assert reconcile(left.iloc[:0], right)["_merge"].tolist() == ["right_only", "right_only"]

def test_data_evidence_inventory():
    new_cards = {card for unit in UNITS for card in unit["cards"]}
    assert new_cards == {id for id in CARDS if id.startswith(("numpy-", "pandas-"))}
    assert len(UNITS) == 8 and len(new_cards) == 16
    for unit in UNITS:
        assert len(unit["cards"]) >= 2
        for card in unit["cards"]:
            assert unit["id"] in CARDS[card]["topics"]
            assert "test_" + card.replace("-", "_") in globals()
    assert np.__version__ == "2.5.4" and pd.__version__ == "3.0.6"
