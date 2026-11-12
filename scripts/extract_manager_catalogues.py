#!/usr/bin/env python3
"""Extract the supplied manager specifications without generating test items.

Uses the UTF-8 text extractions beside the original Word files. Only the
detailed, coded records are parsed: the journey basket tables are not records.
The original source files remain local and are not copied into version control.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
LABELS = {
    "Mesure": "mesure", "Format": "format", "Contenu": "contenu",
    "Scoring": "scoring", "Décision": "decision", "Avancé": "avance",
    "Passerelle": "passerelle",
}
DOMAIN = re.compile(r"^Domaine (\d+) — (.+)$")
TEST = re.compile(r"^(T(\d+)\.(\d+)) — (.+)$")
JOURNEY = re.compile(r"^(D(\d{2})-(P\w+)) — (.+?)\s+\[(.+)\]$")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def domain_context(lines: list[str], start: int, end: int, lot: int) -> dict:
    """Keep the full domain introduction as well as its named fields."""
    raw = lines[start + 1:end]
    context: dict = {"text": "\n".join(raw)}
    if lot == 5:
        field_names = {
            "Objectif": "objective", "Décisions couvertes": "allowed_decisions",
            "Garde-fou": "safeguard", "Banque": "parameters",
        }
        for line in raw:
            for label, key in field_names.items():
                prefix = label + " : "
                if line.startswith(prefix):
                    context[key] = line[len(prefix):]
    else:
        field_names = {
            "Identifiant": "identifier", "Zone": "zone",
            "Niveau de décision": "decision_level", "Objectif": "objective",
            "Décisions couvertes": "allowed_decisions",
            "Décisions interdites": "forbidden_decisions",
            "Garde-fou": "safeguard", "Paramètres": "parameters",
        }
        for index, line in enumerate(raw):
            if line in field_names and index + 1 < len(raw):
                context[field_names[line]] = raw[index + 1]
    return context


def extract(path: Path, lot: int) -> dict:
    lines = path.read_text(encoding="utf-8").splitlines()
    domain_positions = [(i, DOMAIN.fullmatch(line)) for i, line in enumerate(lines)
                        if DOMAIN.fullmatch(line)]
    record_pattern = TEST if lot == 5 else JOURNEY
    positions = [(i, record_pattern.fullmatch(line)) for i, line in enumerate(lines)
                 if record_pattern.fullmatch(line)]
    records = []
    last_end = None
    for index, match in positions:
        domain_start, domain_match = next(
            (i, m) for i, m in reversed(domain_positions) if i < index
        )
        first_record = next(i for i, _ in positions if i > domain_start)
        context_end = first_record
        # The basket is retained separately; it is never treated as a record.
        if lot == 6:
            context_end = next(i for i in range(domain_start + 1, first_record)
                               if lines[i] == "Panier d’outils par palier")
        domain_number = int(domain_match.group(1))
        assert int(match.group(2)) == domain_number, f"Domain mismatch: {match.group(1)}"
        cursor = index + 1
        blocks = {}
        block_lines = {}
        for label, key in LABELS.items():
            if lot == 5 and label == "Passerelle":
                continue
            if lot == 5:
                prefix = label + " : "
                if not lines[cursor].startswith(prefix):
                    raise ValueError(f"Expected {label} at {path.name}:{cursor + 1}")
                value = lines[cursor][len(prefix):]
                block_lines[key] = cursor + 1
                cursor += 1
            else:
                if lines[cursor] != label:
                    raise ValueError(f"Expected {label} at {path.name}:{cursor + 1}")
                value = lines[cursor + 1]
                block_lines[key] = cursor + 2
                cursor += 2
            if not value.strip():
                raise ValueError(f"Empty {label}: {match.group(1)}")
            blocks[key] = value
        record = {
            "code": match.group(1), "title": match.group(4),
            "domain_number": domain_number, "domain": domain_match.group(2),
            "domain_context": domain_context(lines, domain_start, context_end, lot),
            "blocks": blocks,
            "source_lines": {"start": index + 1, "end": cursor, "blocks": block_lines},
        }
        if lot == 5:
            record["wave"] = 1 if domain_number <= 15 else 2 if domain_number <= 35 else 3
        else:
            record["stage"] = re.match(r"P(?:[0-4]|S|B|R|F)", match.group(3)).group(0)
            record["stage_variant"] = match.group(3)
            record["stage_label"] = match.group(5)
            # References are extracted literally; range endpoints are not
            # expanded into codes which did not occur explicitly in this fiche.
            record["related_codes"] = sorted(
                set(re.findall(r"\bT\d+\.\d+\b", "\n".join(blocks.values()))),
                key=lambda code: tuple(map(int, code[1:].split("."))),
            )
            next_domain = next((i for i, _ in domain_positions if i > index), len(lines))
            acceptance_start = next((i for i in range(cursor, next_domain)
                                     if lines[i] == "Critères d’acceptation spécifiques"), None)
            if acceptance_start is not None:
                acceptance_end = next_domain
                # The final domain is followed by a cross-domain summary.
                for i in range(acceptance_start + 1, next_domain):
                    if lines[i] == "4. Synthèse opérationnelle":
                        acceptance_end = i
                        break
                record["domain_acceptance_criteria"] = lines[acceptance_start + 1:acceptance_end]
        records.append(record)
        last_end = cursor
    codes = [record["code"] for record in records]
    if len(codes) != len(set(codes)):
        raise ValueError("Duplicate source code")
    count_by_domain = Counter(record["domain_number"] for record in records)
    expected_domains, expected_records = (50, 350) if lot == 5 else (30, 149)
    if len(domain_positions) != expected_domains or len(records) != expected_records:
        raise ValueError(f"Source count changed: {len(domain_positions)} domains, {len(records)} records")
    if lot == 5 and set(count_by_domain.values()) != {7}:
        raise ValueError("The catalogue no longer contains seven tests per domain")
    if lot == 6:
        expected_stages = {"P0": 22, "P1": 26, "P2": 40, "P3": 13, "P4": 12,
                           "PS": 13, "PB": 7, "PR": 12, "PF": 4}
        if dict(Counter(record["stage"] for record in records)) != expected_stages:
            raise ValueError("Journey stage counts differ from the source summary")
    docx = path.with_suffix(".docx")
    result = {
        "source_document": docx.name,
        "source_sha256": sha256(docx),
        "metadata": {
            "lot": lot, "text_source_sha256": sha256(path),
            "record_count": len(records), "domain_count": len(domain_positions),
            "preamble": "\n".join(lines[:domain_positions[0][0]]),
            "closing_sections": "\n".join(lines[last_end:]),
            "extraction_notes": [
                "Original specification text, not a validated item bank or an implemented test.",
                "Source line numbers refer to the supplied UTF-8 text extraction.",
                "related_codes lists literal T-code references; textual ranges remain in the original blocks.",
            ],
        },
        "records": records,
    }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=ROOT / "docs/lots-outils-manager")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/imports/manager-lots")
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    sources = [
        (5, "Catalogue_350_Outils_Psychometriques", "catalogue-350.json"),
        (6, "Parcours_Evaluation_Cognitive_30_Domaines", "parcours-149.json"),
    ]
    recommendations = args.source_dir / "lot-5/pieces-jointes/Recommandations_Conception_Solution.txt"
    recommendation_text = recommendations.read_text(encoding="utf-8").splitlines()
    recommendation_rules = [
        {"line": index + 1, "text": line}
        for index, line in enumerate(recommendation_text)
        if re.search(r"jamais décision automatique|N4 exclu|conditions de mise en production|"
                     r"Interdictions spécifiques|bandeau de validité systématique|"
                     r"techniquement bloquer|Consentement éclairé et explicite", line)
    ]
    # Le relais sur un autre PC doit disposer des recommandations complètes,
    # pas seulement des garde-fous extraits pour les fiches.
    (args.output_dir / "recommandations-conception.json").write_text(
        json.dumps({
            "source_document": recommendations.with_suffix(".docx").name,
            "source_sha256": sha256(recommendations.with_suffix(".docx")),
            "text_source_sha256": sha256(recommendations),
            "content": recommendations.read_text(encoding="utf-8"),
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    for lot, stem, filename in sources:
        result = extract(args.source_dir / f"lot-{lot}/pieces-jointes/{stem}.txt", lot)
        result["metadata"]["transverse_rules"] = recommendation_rules
        result["metadata"]["recommendations_document"] = recommendations.with_suffix(".docx").name
        result["metadata"]["recommendations_sha256"] = sha256(recommendations.with_suffix(".docx"))
        (args.output_dir / filename).write_text(
            json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"{filename}: {len(result['records'])} records, {result['metadata']['domain_count']} domains")


if __name__ == "__main__":
    main()
