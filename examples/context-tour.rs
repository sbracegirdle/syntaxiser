use std::collections::HashMap;

#[derive(Debug, Clone)]
struct User {
    name: String,
}

trait Greeting {
    fn greeting(&self) -> String;
}

impl Greeting for User {
    fn greeting(&self) -> String {
        format!("Hello, {}", self.name)
    }
}

fn main() {
    let maybe_user: Option<User> = Some(User { name: "Ada".into() });
    if let Some(user) = maybe_user.as_ref() {
        println!("{}", user.greeting());
    }

    let values = vec![1, 2, 3, 4];
    let doubled: Vec<i32> = values.iter().map(|n| n * 2).collect();
    let mut counts = HashMap::new();
    for value in doubled {
        *counts.entry(value).or_insert(0) += 1;
    }
}
