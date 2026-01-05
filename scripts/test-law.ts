import { fetchLawDetail } from "../lib/api/hourei.ts";

async function main() {
  const law = await fetchLawDetail("414AC0000000188");
  console.log(law.markdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
