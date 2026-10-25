import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
COLLECT_JS = (HERE / "collect.js").read_text(encoding="utf-8")
FOCUS_JS = (HERE / "focus.js").read_text(encoding="utf-8")
SETTLE_JS = (HERE / "settle.js").read_text(encoding="utf-8")


def check_focus(page, limit):
    results = []
    seen = set()
    page.mouse.click(1, 1)
    for _ in range(limit):
        page.keyboard.press("Tab")
        info = page.evaluate(FOCUS_JS)
        if not info:
            continue
        if info["key"] in seen:
            break
        seen.add(info["key"])
        results.append(info)
    missing = [r for r in results if not r["indicator"]]
    return {"checked": len(results), "withoutVisibleIndicator": missing[:10]}


def summary_line(run):
    parts = [
        f"{run['scheme']}@{run['viewport']['width']}/{run['state']}",
        f"overflow={'yes' if run['horizontalOverflow'] else 'no'}",
        f"contrast_fail={run['contrastFailureCount']}",
        f"small_targets={run['smallTargetCount']}",
        f"fonts={[f for f, _ in run['fonts']]}",
        f"sizes={len(run['fontSizes'])}",
        f"radii={len(run['radii'])}",
        f"tells={run['tells']}",
        f"motion={run['motion']}",
    ]
    if "focus" in run:
        parts.append(f"focus_missing={len(run['focus']['withoutVisibleIndicator'])}/{run['focus']['checked']}")
    if run["errors"]:
        parts.append(f"errors={len(run['errors'])}")
    return " | ".join(parts)


def main():
    ap = argparse.ArgumentParser(description="Render a page and report measurable design defects.")
    ap.add_argument("target", help="URL or path to an HTML file")
    ap.add_argument("--out", default="design-inspection", help="Directory for screenshots and report.json")
    ap.add_argument("--widths", default="390,768,1440")
    ap.add_argument("--schemes", default="light,dark")
    ap.add_argument("--focus-steps", type=int, default=15)
    ap.add_argument("--state", action="append", default=[], help='Extra state as "name=selector && selector", clicked in order after load')
    args = ap.parse_args()

    target = args.target
    if "://" not in target:
        path = Path(target).resolve()
        if not path.exists():
            sys.exit(f"File not found: {path}")
        target = path.as_uri()
    widths = [int(w) for w in args.widths.split(",") if w.strip()]
    schemes = [s.strip() for s in args.schemes.split(",") if s.strip()]
    states = [("initial", [])]
    for spec in args.state:
        name, _, steps = spec.partition("=")
        if not name.strip() or not steps.strip():
            sys.exit(f'Invalid --state "{spec}". Use "name=selector && selector".')
        states.append((name.strip(), [s.strip() for s in steps.split("&&") if s.strip()]))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    report = {"target": target, "runs": []}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for scheme in schemes:
            for width in widths:
                for state, steps in states:
                    ctx = browser.new_context(viewport={"width": width, "height": 900}, color_scheme=scheme, device_scale_factor=1)
                    page = ctx.new_page()
                    errors = []
                    page.on("pageerror", lambda e, errors=errors: errors.append(str(e)))
                    page.on("console", lambda m, errors=errors: errors.append(m.text) if m.type == "error" else None)
                    try:
                        page.goto(target, wait_until="networkidle", timeout=30000)
                    except Exception as exc:
                        errors.append(f"navigation: {exc}")
                    page.wait_for_timeout(600)
                    for step in steps:
                        try:
                            page.locator(step).first.click(timeout=5000)
                            page.wait_for_timeout(300)
                        except Exception as exc:
                            errors.append(f"state {state}: could not click {step}: {exc}")
                            break
                    page.evaluate(SETTLE_JS)
                    prefix = f"{scheme}-{width}" if state == "initial" else f"{scheme}-{width}-{state}"
                    shot = out / f"{prefix}.png"
                    view = out / f"{prefix}-viewport.png"
                    page.screenshot(path=str(shot), full_page=True)
                    page.screenshot(path=str(view))
                    data = page.evaluate(COLLECT_JS)
                    if state == "initial" and width == max(widths):
                        data["focus"] = check_focus(page, args.focus_steps)
                    data.update({"scheme": scheme, "state": state, "screenshot": str(shot), "viewportScreenshot": str(view), "errors": errors[:10]})
                    report["runs"].append(data)
                    ctx.close()
        browser.close()
    (out / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    for run in report["runs"]:
        print(summary_line(run))
    print(f"report: {out / 'report.json'}")


if __name__ == "__main__":
    main()
