// Curated task themes; independent of language concepts and difficulty.
export const lessonCategories = {
  "general": "General",
  "numbers": "Numbers",
  "text": "Text",
  "collections": "Collections",
  "games": "Games",
  "files": "Files",
  "web": "Web",
  "data": "Data",
  "tooling": "Tooling",
  "concurrency": "Concurrency",
  "testing": "Testing"
} as const;
export type LessonCategory = keyof typeof lessonCategories;

export const curatedCategoryGroups: Record<string, Partial<Record<LessonCategory, string[]>>> = {
  "java": {
    "text": ["java-greeting", "java-word-count"],
    "numbers": ["java-clamp"],
    "data": ["java-records", "java-capstone"],
    "testing": ["java-junit"],
    "files": ["java-file-report"],
    "collections": ["java-stream-totals"],
    "concurrency": ["java-async"],
    "web": ["java-json-api"]
  },
  "python": {
    "text": [
      "hello",
      "collections"
    ],
    "numbers": [
      "functions"
    ],
    "data": [
      "csv-report",
      "validation"
    ],
    "general": [],
    "concurrency": [
      "cancellation"
    ],
    "web": [
      "http-client",
      "json-api"
    ],
    "files": [
      "capstone"
    ],
    "testing": [
      "pytest"
    ]
  },
  "sql": {
    "data": [
      "sql-first-report",
      "sql-missing-orders",
      "sql-null",
      "sql-paid-totals",
      "sql-join-cardinality",
      "sql-ranked-orders",
      "sql-constraints",
      "sql-index-plan",
      "sql-safe-change",
      "sql-report-capstone"
    ]
  },
  "rust": {
    "text": [
      "hello",
      "borrowing",
      "rs-regex",
      "word-count"
    ],
    "numbers": [
      "variables",
      "functions",
      "branches-loops",
      "results"
    ],
    "collections": [
      "structs-options",
      "rs-slice",
      "rs-sort",
      "iterator-pipeline",
      "rs-entry"
    ],
    "general": [
      "rs-match",
      "traits",
      "rs-errors",
      "rs-context"
    ],
    "concurrency": [
      "threads",
      "rs-timeout",
      "rs-channel",
      "rs-cancel",
      "rs-blocking",
      "rs-worker-capstone"
    ],
    "data": [
      "rs-serde",
      "rs-toml",
      "rs-config-capstone",
      "rs-report-capstone",
      "rs-serde-default"
    ],
    "web": [
      "rs-http",
      "rs-client",
      "rs-api-capstone"
    ],
    "tooling": [
      "rs-clap",
      "rs-tracing"
    ],
    "files": [
      "capstone",
      "rs-io"
    ],
    "testing": [
      "rs-rand"
    ]
  },
  "go": {
    "text": [
      "hello",
      "word-count"
    ],
    "numbers": [
      "variables",
      "functions",
      "branches-loops",
      "errors"
    ],
    "collections": [
      "slices",
      "go-map-update",
      "go-copy",
      "go-sort"
    ],
    "general": [
      "structs",
      "interfaces",
      "go-errors-as",
      "go-wrap"
    ],
    "files": [
      "go-defer",
      "go-files",
      "capstone",
      "go-reader"
    ],
    "testing": [
      "table-tests",
      "go-fuzz",
      "go-benchmark-capstone"
    ],
    "data": [
      "go-json",
      "go-sql",
      "go-config-capstone"
    ],
    "web": [
      "go-json-output",
      "go-http-input",
      "go-subtests",
      "go-deadline",
      "go-service-capstone"
    ],
    "concurrency": [
      "goroutines",
      "go-context",
      "go-channel-close",
      "go-bounded",
      "go-mutex",
      "go-pipeline-capstone"
    ],
    "tooling": [
      "go-slog"
    ]
  },
  "typescript": {
    "numbers": [
      "ts-values",
      "ts-unions"
    ],
    "collections": [
      "ts-functions",
      "ts-collections",
      "ts-generics",
      "ts-store"
    ],
    "web": [
      "ts-props",
      "ts-reducer",
      "ts-events",
      "ts-effect",
      "ts-express",
      "ts-query",
      "ts-capstone",
      "ts-api-capstone"
    ],
    "general": [
      "ts-discriminants"
    ],
    "data": [
      "ts-parse"
    ],
    "concurrency": [
      "ts-async",
      "ts-cancel"
    ],
    "testing": [
      "ts-tests"
    ],
    "text": [
      "ts-optional"
    ]
  },
  "shellscript": {
    "files": [
      "sh-location",
      "sh-spaces",
      "sh-search",
      "sh-report"
    ],
    "tooling": [
      "sh-env",
      "sh-status",
      "sh-args",
      "sh-trap",
      "sh-git-review",
      "sh-git-branch",
      "sh-git-conflict",
      "sh-node-tools",
      "sh-language-tools",
      "sh-quality"
    ],
    "text": [
      "sh-pipes"
    ]
  },
  "javascript": {
    "numbers": [
      "js-values"
    ],
    "collections": [
      "js-functions",
      "js-map"
    ],
    "general": [
      "js-objects",
      "js-closures"
    ],
    "concurrency": [
      "js-promises"
    ],
    "web": [
      "js-dom",
      "js-jsx",
      "js-cancel",
      "js-effect",
      "js-express",
      "js-board-capstone",
      "js-api-capstone"
    ],
    "files": [
      "js-files"
    ],
    "testing": [
      "js-tests"
    ]
  },
  "html": {
    "web": [
      "html-document",
      "html-links",
      "html-image",
      "html-table",
      "html-form",
      "html-groups",
      "html-details",
      "html-dialog",
      "html-capstone",
      "html-progressive"
    ]
  },
  "css": {
    "web": [
      "css-selectors",
      "css-box",
      "css-flow",
      "css-grid",
      "css-custom",
      "css-focus",
      "css-breakpoints",
      "css-motion",
      "css-capstone",
      "css-libraries"
    ]
  }
};
