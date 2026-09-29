"""Proofline as an MCP server, so any agent (Claude, an IDE assistant, an internal bot) can
check its own numbers before a report leaves the building.

Run over stdio:  ``proofline-mcp``  (requires ``pip install 'proofline[mcp]'``)

Tools
-----
compute_facts      CSV text + dataset spec  -> fact sheet (JSON)
facts_brief        fact sheet               -> prompt-ready listing of every citable number
verify_narrative   text + fact sheet        -> per-claim verdicts; ``passed`` is false on any contradiction
repair_narrative   text + fact sheet        -> minimally edited text + the edits made
"""

from __future__ import annotations

import csv
import io
from typing import Any

from mcp.server.mcpserver import MCPServer

from .facts import DatasetSpec, FactSheet, compute_facts
from .loop import facts_brief as _facts_brief
from .render import summary
from .repair import repair_text
from .verify import verify_text


def build_server() -> MCPServer:
    server = MCPServer(
        name="proofline",
        instructions=(
            "Verify every number in generated business text against data before publishing it. "
            "Call compute_facts once per dataset, cite values from facts_brief when writing, then call "
            "verify_narrative on the draft and fix or repair anything contradicted."
        ),
    )

    @server.tool(name="compute_facts")
    def compute_facts_tool(csv_text: str, spec: dict[str, Any]) -> dict[str, Any]:
        """Compute the fact sheet (levels, comparison bases, absolute and percent changes per metric
        and entity) from CSV text and a dataset spec. Returns the fact sheet as JSON."""
        rows = list(csv.DictReader(io.StringIO(csv_text)))
        return compute_facts(DatasetSpec.from_dict(spec), rows).to_dict()

    @server.tool()
    def facts_brief(facts: dict[str, Any]) -> str:
        """Readable listing of every fact, grouped by entity and metric, for use in a writing prompt."""
        return _facts_brief(FactSheet.from_dict(facts))

    @server.tool()
    def verify_narrative(text: str, facts: dict[str, Any]) -> dict[str, Any]:
        """Check every numeric and directional claim in `text` against the fact sheet."""
        sheet = FactSheet.from_dict(facts)
        report = verify_text(text, sheet)
        return {**report.to_dict(), "summary": summary(report)}

    @server.tool()
    def repair_narrative(text: str, facts: dict[str, Any]) -> dict[str, Any]:
        """Minimally edit contradicted claims so they match the facts. Unverifiable claims are left alone."""
        sheet = FactSheet.from_dict(facts)
        report = verify_text(text, sheet)
        fixed, edits = repair_text(report, sheet)
        after = verify_text(fixed, sheet)
        return {
            "text": fixed,
            "edits": [{"before": e.before, "after": e.after, "reason": e.reason, "start": e.start} for e in edits],
            "passed": after.passed,
            "remaining_unverifiable": len(after.unverifiable),
        }

    return server


def main() -> None:  # pragma: no cover - entry point
    build_server().run("stdio")


if __name__ == "__main__":  # pragma: no cover
    main()
