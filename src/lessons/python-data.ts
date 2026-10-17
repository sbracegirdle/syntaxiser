import type { LessonExercise } from './expanded';

// Unsolved data tasks; stable identities preserve saved progress.
export const pythonDataExercises: LessonExercise[] = [
  {
    "lesson": {
      "id": "py-data-array",
      "difficulty": 3,
      "title": "Validate a sensor matrix",
      "category": "data",
      "instructions": "Prerequisites: collections, pytest.\n\nGoal: Convert rectangular input into a two-column float64 sensor matrix. Reject malformed, nonfinite and wrong-shape inputs. Preserve a zero-row, two-column input.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: numpy-arrays; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://numpy.org/doc/stable/user/absolute_beginners.html",
      "starter": "",
      "check": "Assert [[1,2],[3,4]] has shape (2,2) and dtype float64; a (0,2) input stays (0,2). Reject ragged rows, text, NaN and infinity; valid input must still work afterward."
    },
    "topics": [
      "numpy-arrays"
    ],
    "prerequisites": [
      "collections",
      "pytest"
    ],
    "reference": "https://numpy.org/doc/stable/user/absolute_beginners.html"
  },
  {
    "lesson": {
      "id": "py-data-view",
      "difficulty": 3,
      "title": "Compare shared and isolated samples",
      "category": "data",
      "instructions": "Prerequisites: py-data-array.\n\nGoal: Write a bounded calibration operation over a basic slice and an independent advanced-index selection. Compare memory sharing and the source after mutation.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: numpy-indexing; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://numpy.org/doc/stable/user/absolute_beginners.html",
      "starter": "",
      "check": "For [1,2,3], offset the first two entries by 10 to get [11,12,3]. Editing a sample of positions [2,0] must leave that source unchanged. Check an empty slice and invalid bounds, then recover."
    },
    "topics": [
      "numpy-indexing"
    ],
    "prerequisites": [
      "py-data-array"
    ],
    "reference": "https://numpy.org/doc/stable/user/absolute_beginners.html"
  },
  {
    "lesson": {
      "id": "py-data-broadcast",
      "difficulty": 4,
      "title": "Calibrate measurement columns",
      "category": "data",
      "instructions": "Prerequisites: py-data-view.\n\nGoal: Scale each column of a float64 matrix by a vector without changing either input. Require exactly one factor per column and explain trailing-axis compatibility.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: numpy-broadcasting; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://numpy.org/doc/stable/user/absolute_beginners.html",
      "starter": "",
      "check": "[[1,2],[3,4]] with [10,100] yields [[10,200],[30,400]]. Preserve a (0,2) result; reject three factors and prove a later valid operation works. Assert source and factor buffers remain unchanged."
    },
    "topics": [
      "numpy-broadcasting"
    ],
    "prerequisites": [
      "py-data-view"
    ],
    "reference": "https://numpy.org/doc/stable/user/absolute_beginners.html"
  },
  {
    "lesson": {
      "id": "py-data-reduce",
      "difficulty": 4,
      "title": "Average incomplete sensor readings",
      "category": "data",
      "instructions": "Prerequisites: py-data-broadcast.\n\nGoal: Reduce observed sensor values by column, treating NaN as missing and infinity as invalid. Choose an explicit all-missing and zero-row policy that emits no empty-mean warning.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: numpy-reductions; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://numpy.org/doc/stable/user/absolute_beginners.html",
      "starter": "",
      "check": "[[1,NaN],[3,6]] yields [2,6]. Empty (0,2) input and an all-missing column produce NaN in the corresponding means. Reject infinity; verify successful computation afterward and the returned shape/dtype."
    },
    "topics": [
      "numpy-reductions"
    ],
    "prerequisites": [
      "py-data-broadcast"
    ],
    "reference": "https://numpy.org/doc/stable/user/absolute_beginners.html"
  },
  {
    "lesson": {
      "id": "py-data-csv",
      "difficulty": 3,
      "title": "Ingest nullable order quantities",
      "category": "data",
      "instructions": "Prerequisites: csv-report, pytest.\n\nGoal: Read local CSVs using string names and nullable Int64 quantities. Preserve missing quantities, reject missing names, wrong headers, malformed/fractional quantities and negative counts.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: pandas-ingestion; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",
      "starter": "",
      "check": "A quoted name containing a comma parses correctly. Header-only input produces a typed empty frame; blank quantity is missing while zero is known. Every invalid CSV raises; a corrected file succeeds afterward."
    },
    "topics": [
      "pandas-ingestion"
    ],
    "prerequisites": [
      "csv-report",
      "pytest"
    ],
    "reference": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html"
  },
  {
    "lesson": {
      "id": "py-data-labels",
      "difficulty": 3,
      "title": "Align scores by customer labels",
      "category": "data",
      "instructions": "Prerequisites: py-data-csv.\n\nGoal: Assign a Series of scores to a customer frame by unique matching labels. Return an independent result under pandas 3 Copy-on-Write; compare label and positional selection and nullable masks.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: pandas-selection; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",
      "starter": "",
      "check": "Customers indexed [a,b] and scores indexed [b,a] with values [20,10] produce [10,20]. Reject duplicate or missing labels, accept empty matching inputs, and verify result mutation leaves the original unchanged."
    },
    "topics": [
      "pandas-selection"
    ],
    "prerequisites": [
      "py-data-csv"
    ],
    "reference": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html"
  },
  {
    "lesson": {
      "id": "py-data-group",
      "difficulty": 4,
      "title": "Summarize incomplete orders",
      "category": "data",
      "instructions": "Prerequisites: py-data-labels.\n\nGoal: Group typed order rows by name. Retain all-missing totals as unknown, distinguish row counts from observed counts and sort output keys explicitly.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: pandas-grouping; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",
      "starter": "",
      "check": "Tea quantities 2 and 3 total 5; coffee with only a missing quantity remains unknown. Empty input has no groups. Reject missing required names, recover with valid data, and check order stability under shuffled input."
    },
    "topics": [
      "pandas-grouping"
    ],
    "prerequisites": [
      "py-data-labels"
    ],
    "reference": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html"
  },
  {
    "lesson": {
      "id": "py-data-join",
      "difficulty": 4,
      "title": "Enrich orders with a unique product lookup",
      "category": "data",
      "instructions": "Prerequisites: py-data-group.\n\nGoal: Merge repeated product keys from orders with a unique product price lookup. Validate many-to-one cardinality, reject null/unmatched keys and sort by unique order id.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: pandas-joins; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html",
      "starter": "",
      "check": "Orders [2,1] for tea and a tea price of 3 return ids [1,2] with prices [3,3]. Duplicate lookup keys raise MergeError; missing/null keys fail; empty orders work. Repair the lookup and repeat successfully."
    },
    "topics": [
      "pandas-joins"
    ],
    "prerequisites": [
      "py-data-group"
    ],
    "reference": "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html"
  },
  {
    "lesson": {
      "id": "py-data-capstone",
      "difficulty": 5,
      "title": "Build a deterministic tabular report",
      "category": "data",
      "instructions": "Prerequisites: py-data-reduce, py-data-join.\n\nGoal: Combine typed CSV ingestion, validated product joins, nullable grouping and a NumPy numeric summary in a disposable project. Emit a local sorted report, preserve unknown totals and separate I/O from transformations.\n\nSetup and run: Follow playground/python/README.md with Python 3.13.7, NumPy 2.5.4 and pandas 3.0.6. Create your own exercise and test files in a disposable copy; run uv sync --project playground/python --locked, then uv run --project playground/python --locked pytest path/to/your/tests -q. Use only local fixtures and temporary CSV files. Reference prerequisites: numpy-reductions, pandas-ingestion, pandas-grouping, pandas-joins; docs/python-data.md maps runnable boundary examples.\n\nLearning reference: https://numpy.org/doc/stable/user/absolute_beginners.html",
      "starter": "",
      "check": "Tea quantities 2 and 3 at price 4 report quantity 5 and value 20; coffee with unknown quantity stays unknown. Check empty files, malformed fields, duplicate product keys, shuffled rows, recovery after rejection and unchanged input frames. Compare a numeric mean only over known totals."
    },
    "topics": [
      "numpy-reductions",
      "pandas-ingestion",
      "pandas-grouping",
      "pandas-joins"
    ],
    "prerequisites": [
      "py-data-reduce",
      "py-data-join"
    ],
    "reference": "https://numpy.org/doc/stable/user/absolute_beginners.html"
  }
];
