# Architecture Decision Records

Capture major technical decisions here so we can revisit the context behind them. Every record should use the template in this folder and live in a file named `NNNN-title.md` where `NNNN` is a four-digit sequence starting at 0001.

## How to add a new ADR

1. Copy `000-template.md` to a new file with the next sequence number.
2. Fill in the metadata (status, date, authors, links) and complete each section with concise but complete context.
3. Open a pull request containing the ADR. Mention if the PR also delivers the implementation or if it will follow later.
4. The team discusses and approves the ADR in the PR. Update the status to `Accepted` once consensus is reached.
5. If a future ADR changes the decision, update the old record to `Superseded` and link to the new one.

ADRs are lightweight documentation that keeps architectural knowledge from getting lost in chat logs or code reviews. Aim for clarity over perfection.
