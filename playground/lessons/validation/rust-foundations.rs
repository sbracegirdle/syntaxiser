// Maintainer feasibility checks only; never loaded or shown as lesson snippets.
#[test]
fn first_step_number_outcomes() {
    let fahrenheit = |c: f64| c * 9.0 / 5.0 + 32.0;
    assert_eq!(fahrenheit(0.0), 32.0);
    assert_eq!(fahrenheit(100.0), 212.0);
    assert!((fahrenheit(-10.0) - 14.0).abs() < 1e-9);
    let receipt = |quantity| quantity * 125 + 50;
    assert_eq!([receipt(3), receipt(0), receipt(2)], [425, 50, 300]);
    let duration = |n| (n / 60, n % 60);
    assert_eq!(
        [duration(125), duration(60), duration(0)],
        [(2, 5), (1, 0), (0, 0)]
    );
    let area = |w, h| w * h;
    let perimeter = |w, h| 2 * (w + h);
    assert_eq!(area(3, 4), 12);
    assert_eq!(perimeter(3, 4), 14);
    assert_eq!(area(0, 4), 0);
    assert_eq!(area(3, 3), 9);
    assert_eq!(perimeter(0, 0), 0);
    for n in [2, 0, -4] {
        assert_eq!(n % 2, 0);
    }
    for n in [3, -3] {
        assert_ne!(n % 2, 0);
    }
    assert_eq!(150.0_f64 / 60.0, 2.5);
    assert_eq!(0.0_f64 / 60.0, 0.0);
}
#[test]
fn first_step_text_and_game_outcomes() {
    let introduction = |name, city, age| format!("{name} is {age} and lives in {city}.");
    assert_eq!(
        introduction("Ada", "Perth", 30),
        "Ada is 30 and lives in Perth."
    );
    assert_eq!(
        introduction("Ben", "Rome", 20),
        "Ben is 20 and lives in Rome."
    );
    for (text, bytes, scalars) in [("cat", 3, 3), ("café", 5, 4)] {
        assert_eq!(text.len(), bytes);
        assert_eq!(text.chars().count(), scalars);
    }
    for (input, expected) in [
        ("  Ada \n", "[Ada]"),
        (" \n ", "[]"),
        ("red book", "[red book]"),
    ] {
        assert_eq!(format!("[{}]", input.trim()), expected);
    }
    let scoreboard = |a, x, b, y| format!("{a} {x} - {y} {b}");
    assert_eq!(scoreboard("Owls", 3, "Foxes", 2), "Owls 3 - 2 Foxes");
    assert_eq!(scoreboard("Cats", 0, "Dogs", 0), "Cats 0 - 0 Dogs");
    for (index, position) in [(0, (0, 0)), (4, (1, 1)), (8, (2, 2))] {
        assert_eq!((index / 3, index % 3), position);
    }
    for index in 0..9 {
        assert!((0..=2).contains(&(index / 3)) && (0..=2).contains(&(index % 3)));
    }
    let first_player = true;
    assert!(!(!first_player));
    assert!(!first_player == false);
}
#[test]
fn beginner_numeric_algorithms() {
    let clamp = |n: i32, min, max| n.clamp(min, max);
    assert_eq!(
        [clamp(-3, 0, 10), clamp(4, 0, 10), clamp(15, 0, 10)],
        [0, 4, 10]
    );
    assert_eq!(clamp(0, 0, 10), 0);
    assert_eq!(clamp(10, 0, 10), 10);
    assert_eq!(clamp(8, 3, 3), 3);
    let fizzbuzz = |n: u32| {
        (1..=n)
            .map(|i| {
                if i % 15 == 0 {
                    "fizzbuzz".into()
                } else if i % 3 == 0 {
                    "fizz".into()
                } else if i % 5 == 0 {
                    "buzz".into()
                } else {
                    i.to_string()
                }
            })
            .collect::<Vec<String>>()
    };
    assert!(fizzbuzz(0).is_empty());
    let labels = fizzbuzz(15);
    assert_eq!(
        (&labels[2], &labels[4], &labels[14]),
        (&"fizz".into(), &"buzz".into(), &"fizzbuzz".into())
    );
    let factorial = |n: u64| (1..=n).product::<u64>();
    for (n, expected) in [(0, 1), (1, 1), (5, 120), (12, 479001600)] {
        assert_eq!(factorial(n), expected);
    }
    let table = |n: i32| (1..=10).map(|i| n * i).collect::<Vec<_>>();
    assert_eq!(table(3), [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);
    assert_eq!(table(0), [0; 10]);
    assert_eq!(table(-1), [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10]);
    let digit_sum = |mut n: u32| {
        let mut sum = 0;
        while n > 0 {
            sum += n % 10;
            n /= 10;
        }
        sum
    };
    for (n, expected) in [(507, 12), (9, 9), (0, 0), (1000, 1)] {
        assert_eq!(digit_sum(n), expected);
    }
    let mean = |values: &[i32]| {
        if values.is_empty() {
            None
        } else {
            Some(values.iter().map(|&n| f64::from(n)).sum::<f64>() / values.len() as f64)
        }
    };
    assert_eq!(mean(&[2, 3]), Some(2.5));
    assert_eq!(mean(&[0]), Some(0.0));
    assert_eq!(mean(&[]), None);
}
fn adjacent(values: &[i32]) -> Vec<i32> {
    let mut result = Vec::new();
    for &value in values {
        if result.last() != Some(&value) {
            result.push(value);
        }
    }
    result
}
fn rotate(values: &[i32]) -> Vec<i32> {
    let mut copy = values.to_vec();
    if !copy.is_empty() {
        copy.rotate_left(1);
    }
    copy
}
#[test]
fn beginner_collection_outcomes() {
    let count =
        |values: &[i32], low, high| values.iter().filter(|&&n| n >= low && n <= high).count();
    assert_eq!(count(&[1, 3, 3, 7], 2, 5), 2);
    assert_eq!(count(&[], 2, 5), 0);
    assert_eq!(count(&[2, 5], 2, 5), 2);
    assert_eq!(count(&[3], 5, 2), 0);
    assert_eq!(adjacent(&[1, 1, 2, 1, 1]), [1, 2, 1]);
    assert!(adjacent(&[]).is_empty());
    assert_eq!(adjacent(&[3, 3, 3]), [3]);
    let pairs: Vec<_> = ["Ada", "Ben"].into_iter().zip([3, 5]).collect();
    assert_eq!(pairs, [("Ada", 3), ("Ben", 5)]);
    assert_eq!(["Ada", "Ben"].iter().zip([3]).count(), 1);
    assert_eq!(["Ada"].iter().zip([] as [i32; 0]).count(), 0);
    assert_eq!(rotate(&[1, 2, 3]), [2, 3, 1]);
    assert!(rotate(&[]).is_empty());
    assert_eq!(rotate(&[7]), [7]);
    assert_eq!(rotate(&rotate(&rotate(&[1, 2, 3]))), [1, 2, 3]);
    assert_eq!([1, 3, 3].iter().position(|&n| n == 3), Some(1));
    assert_eq!([1, 3, 3].iter().position(|&n| n == 7), None);
    assert_eq!(([] as [i32; 0]).iter().position(|&n| n == 7), None);
    let input = vec![-2, 0, 3, 5, -1];
    let (positive, other): (Vec<_>, Vec<_>) = input.iter().copied().partition(|&n| n > 0);
    assert_eq!(positive, [3, 5]);
    assert_eq!(other, [-2, 0, -1]);
    assert_eq!(input, [-2, 0, 3, 5, -1]);
    let (a, b): (Vec<i32>, Vec<i32>) = Vec::<i32>::new().into_iter().partition(|&n| n > 0);
    assert!(a.is_empty() && b.is_empty());
}
fn initials(text: &str) -> String {
    text.split_whitespace()
        .filter_map(|word| word.chars().next())
        .flat_map(char::to_uppercase)
        .collect()
}
fn replace_words(text: &str, target: &str, replacement: &str) -> String {
    text.split_whitespace()
        .map(|word| if word == target { replacement } else { word })
        .collect::<Vec<_>>()
        .join(" ")
}
fn palindrome(text: &str) -> bool {
    let cleaned: Vec<_> = text
        .bytes()
        .filter(|c| !c.is_ascii_whitespace())
        .map(|c| c.to_ascii_lowercase())
        .collect();
    cleaned.iter().eq(cleaned.iter().rev())
}
#[test]
fn beginner_unicode_and_text_outcomes() {
    assert_eq!(initials(" Ada  Lovelace "), "AL");
    assert_eq!(initials("Émile Zola"), "ÉZ");
    assert_eq!(initials(""), "");
    assert_eq!(
        replace_words("red redwood red", "red", "blue"),
        "blue redwood blue"
    );
    assert_eq!(replace_words("Red red,", "red", "blue"), "Red red,");
    assert_eq!(replace_words("", "red", "blue"), "");
    assert!(palindrome("Never odd or even"));
    assert!(!palindrome("Rust"));
    assert!(palindrome(""));
    assert!(palindrome("a!a"));
    assert_eq!(
        "cat café"
            .split_whitespace()
            .map(|word| word.chars().count())
            .collect::<Vec<_>>(),
        [3, 4]
    );
    assert_eq!(" \n".split_whitespace().count(), 0);
    let lines: Vec<_> = " Ada \n\n Ben "
        .lines()
        .enumerate()
        .filter_map(|(i, line)| {
            let text = line.trim();
            if text.is_empty() {
                None
            } else {
                Some((i + 1, text))
            }
        })
        .collect();
    assert_eq!(lines, [(1, "Ada"), (3, "Ben")]);
    assert!(" \n ".lines().all(|line| line.trim().is_empty()));
}
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Move {
    Rock,
    Paper,
    Scissors,
}
fn outcome(a: Move, b: Move) -> i8 {
    use Move::*;
    if a == b {
        0
    } else if matches!((a, b), (Rock, Scissors) | (Paper, Rock) | (Scissors, Paper)) {
        1
    } else {
        -1
    }
}
#[test]
fn games_guess_dice_damage_and_all_move_pairs() {
    use std::cmp::Ordering;
    for (guess, expected) in [
        (3, Ordering::Less),
        (7, Ordering::Equal),
        (9, Ordering::Greater),
        (-1, Ordering::Less),
    ] {
        assert_eq!(guess.cmp(&7), expected);
    }
    for a in [Move::Rock, Move::Paper, Move::Scissors] {
        for b in [Move::Rock, Move::Paper, Move::Scissors] {
            assert_eq!(outcome(a, b), -outcome(b, a));
        }
    }
    assert_eq!(outcome(Move::Rock, Move::Scissors), 1);
    assert_eq!(outcome(Move::Scissors, Move::Paper), 1);
    assert_eq!(outcome(Move::Paper, Move::Rock), 1);
    let counts = |rolls: &[u8]| {
        let mut counts = [0; 6];
        for &roll in rolls {
            if (1..=6).contains(&roll) {
                counts[usize::from(roll - 1)] += 1;
            }
        }
        counts
    };
    assert_eq!(counts(&[1, 6, 1, 3, 0, 7]), [2, 0, 1, 0, 0, 1]);
    assert_eq!(counts(&[]), [0; 6]);
    let damage = |health: u32, hit| {
        let next = health.saturating_sub(hit);
        (next, next > 0)
    };
    for (health, hit, expected) in [
        (10, 3, (7, true)),
        (10, 10, (0, false)),
        (10, 15, (0, false)),
        (10, 0, (10, true)),
    ] {
        assert_eq!(damage(health, hit), expected);
    }
    let round = |secret, guesses: &[i32]| {
        let mut attempts = 0;
        for &guess in guesses {
            attempts += 1;
            if guess == secret {
                return (attempts, true);
            }
        }
        (attempts, false)
    };
    assert_eq!(round(7, &[2, 7, 9]), (2, true));
    assert_eq!(round(7, &[2, 3]), (2, false));
    assert_eq!(round(7, &[]), (0, false));
}
fn winner(board: [Option<u8>; 9]) -> Option<u8> {
    for [a, b, c] in [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ] {
        if let Some(player) = board[a] {
            if board[b] == Some(player) && board[c] == Some(player) {
                return Some(player);
            }
        }
    }
    None
}
#[test]
fn all_winning_lines_and_no_empty_winner() {
    assert_eq!(winner([None; 9]), None);
    for line in [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ] {
        let mut board = [None; 9];
        for i in line {
            board[i] = Some(1);
        }
        assert_eq!(winner(board), Some(1));
        board[line[0]] = None;
        assert_eq!(winner(board), None);
    }
}
#[test]
fn classify_path_values_without_filesystem_access() {
    use std::path::Path;
    let classify = |text: &str| match Path::new(text).extension().and_then(|ext| ext.to_str()) {
        Some("rs") => "Rust",
        Some("txt") => "text",
        _ => "other",
    };
    for (text, expected) in [
        ("main.rs", "Rust"),
        ("notes.txt", "text"),
        ("README", "other"),
        ("dir.rs/README", "other"),
    ] {
        assert_eq!(classify(text), expected);
    }
}
