// Feasibility probes compiled with the existing pinned library fixture.
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    #[serde(rename = "displayName")]
    name: String,
    #[serde(default = "retries")]
    retries: u32,
    #[serde(skip)]
    secret: String,
}
fn retries() -> u32 { 3 }

#[test]
fn config_defaults_roundtrip_and_validation() {
    let mut config: Config = serde_json::from_str(r#"{"displayName":"Ada"}"#).unwrap();
    assert_eq!(config.retries, 3);
    config.secret = "never serialize".into();
    let json = serde_json::to_string(&config).unwrap();
    assert!(json.contains("displayName")); assert!(!json.contains("secret"));
    assert!(serde_json::from_str::<Config>("{bad").is_err());
    assert!(serde_json::from_str::<Config>(r#"{"displayName":"Ada","retries":-1}"#).is_err());
}
#[test]
fn toml_records_and_quoted_names() {
    #[derive(Deserialize)] struct Item { name: String, quantity: u32 }
    #[derive(Deserialize)] struct Inventory { items: Vec<Item> }
    let input = "[[items]]\nname='red book'\nquantity=2\n[[items]]\nname='blue book'\nquantity=3\n";
    let parsed: Inventory = toml::from_str(input).unwrap();
    assert_eq!(parsed.items.iter().map(|item|item.quantity).sum::<u32>(), 5);
    assert_eq!(parsed.items[0].name, "red book");
    assert!(toml::from_str::<Inventory>("[[items]]\nname='missing quantity'").is_err());
}
#[test]
fn regex_and_reproducible_shuffle() {
    use rand::{SeedableRng, seq::SliceRandom};
    let pattern = regex::Regex::new(r"id=(\d+)").unwrap();
    let values: Vec<u32> = pattern.captures_iter("id=12 x id=7").map(|c|c[1].parse().unwrap()).collect();
    assert_eq!(values, [12,7]);
    let mut a = vec![1,2,3,4]; let mut b = a.clone();
    a.shuffle(&mut rand::rngs::StdRng::seed_from_u64(7));
    b.shuffle(&mut rand::rngs::StdRng::seed_from_u64(7));
    assert_eq!(a,b); a.sort(); assert_eq!(a,[1,2,3,4]);
}
#[tokio::test]
async fn timeout_channel_closure_and_join_errors() {
    use std::{future::pending, time::Duration};
    assert_eq!(tokio::time::timeout(Duration::from_millis(10), async {21}).await.unwrap(),21);
    assert!(tokio::time::timeout(Duration::from_millis(1),pending::<()>()).await.is_err());
    let (sender,mut receiver) = tokio::sync::mpsc::channel(2);
    let a = sender.clone();
    let first = tokio::spawn(async move {for n in 0..3 {a.send(n).await.unwrap();}});
    let second = tokio::spawn(async move {for n in 3..6 {sender.send(n).await.unwrap();}});
    let mut values = vec![]; while let Some(n)=receiver.recv().await {values.push(n);}
    first.await.unwrap();second.await.unwrap();values.sort();assert_eq!(values,[0,1,2,3,4,5]);
    let join = tokio::task::spawn_blocking(||panic!("controlled lesson failure")).await;
    assert!(join.unwrap_err().is_panic());
}
#[test]
fn clap_range_checks() {
    use clap::Parser;
    #[derive(Parser)] struct Args {
        input: std::path::PathBuf,
        #[arg(long, value_parser=clap::value_parser!(u8).range(1..=5))]
        count: u8,
    }
    assert!(Args::try_parse_from(["lesson","file","--count","3"]).is_ok());
    for count in ["0","6"] {assert!(Args::try_parse_from(["lesson","file","--count",count]).is_err());}
}
