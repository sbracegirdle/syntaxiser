/*
Rust challenges — work through these in order, adding your own examples/tests.

3. Slice statistics: accept `&[i32]` and compute its sum and largest value.
   Return `Option<i32>` for the largest value so an empty slice is supported.

4. String processing: accept `&str` and return a `String` containing its
   words in reverse order. Handle repeated whitespace and non-ASCII text.

5. Ownership lab: write one function that takes ownership of a `String`,
   one that reads it via `&str`, and one that changes it via `&mut String`.
   Try using a value after moving it and overlapping mutable borrows;
   understand the compiler errors, then fix them without cloning.

6. Model a bank account: define an `Account` struct with a name and balance
   in integer cents. Add `new`, `deposit`, and `withdraw` methods in an
   `impl` block; have `withdraw` report failure without changing the balance.

7. Model commands: define a `Command` enum with variants carrying data for
   deposits, withdrawals, and balance queries. Use an exhaustive `match`
   to apply commands to your account, and derive `Debug` for inspection.

8. Parse fallible input: turn strings like "deposit 100" into commands.
   Return `Result<Command, ParseCommandError>` with your own error enum;
   handle missing arguments, invalid amounts, and unknown commands. Use `?`
   to propagate failures instead of `unwrap` or `expect`.

9. Count words: accept `&str` and return a `HashMap<String, usize>` of
   case-insensitive word counts. Use iterators and the entry API, then
   display counts sorted by frequency, breaking ties alphabetically.

10. Build a word-count CLI: accept a file path from command-line arguments,
    read the file, and reuse challenge 9. Propagate errors with `Result`,
    print useful failures to stderr, and exit unsuccessfully on failure.
    Add unit tests for counting and an integration test that runs the CLI
    against a fixture file, including a missing-file case.
*/

fn sum_slice(slice: &[i32]) -> i32 {
    let mut sum = 0;
    for n in slice {
        sum += n;
    }
    return sum;
}

fn fizz_buzz() {
    for n in 1..100 {
        if n % 3 == 0 {
            println!("Fizz")
        } else if n % 5 == 0 {
            println!("Buzz")
        } else {
            println!("{n}")
        }
    }
}

fn bigger(a: i32, b: i32) -> bool {
    if a > b {
        true
    } else {
        false
    }
}

fn sum(a: i32, b: i32) -> i32 {
    return a + b;
}

fn main() {
    // fizz_buzz();
    let val = sum(4, 2);
    let is_bigger = bigger(32, 16);
    let my_slice = [1, 2, 3];
    let summed_slice = sum_slice(&my_slice);
    println!("Hello, world! {val} {is_bigger} {summed_slice}");
}
