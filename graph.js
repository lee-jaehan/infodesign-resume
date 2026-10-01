(function () {
  "use strict";

  var root = document.getElementById("activity-graph");
  if (!root) return;

  var DAY = 86400000;
  var FIRST = Date.UTC(2016, 0, 1);
  var CALENDAR_FIRST = Date.UTC(2021, 0, 1);
  var LAST = Date.UTC(2026, 11, 31);
  var GRID_START = CALENDAR_FIRST - new Date(CALENDAR_FIRST).getUTCDay() * DAY;
  var WEEK_COUNT = Math.ceil(((LAST - GRID_START) / DAY + 1) / 7);
  var SUMMARY_COLUMNS = 14;
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Calendar placement is a visualization rule, not an assertion of exact dates.
  // Year-only records occupy January–June; month records occupy whole months.
  var activities = [
    { id: "visual-basic", title: "Visual Basic 공부", start: "2016-01", end: "2016-06", date: "2016년", kind: "range", important: "프로그래머 꿈의 시작", description: "Visual Basic으로 프로그래밍을 시작했습니다." },
    { id: "dimigo", title: "한국디지털미디어고등학교 웹프로그래밍과", start: "2021-03", end: "2024-01", date: "2021년 3월–2024년 1월", kind: "range", description: "프로그래머의 꿈을 이루기 위해 웹프로그래밍과에 입학했습니다." },
    { id: "modoolist", title: "modoolist 앱 디자인", start: "2021-04", end: "2021-06", date: "2021년 4월–6월", kind: "range", important: "첫 디자인 입문", description: "교내 동아리에서 목표 관리 앱을 Adobe XD로 디자인했습니다." },
    { id: "newsletter-start", title: "뭐지 뉴스레터 활동 시작", start: "2022-06", date: "2022년 6월", kind: "event", description: "개발자 친구와 함께 뉴스레터 팀 활동을 시작했습니다." },
    { id: "newsletter-redesign", title: "뭐지 뉴스레터 리디자인", start: "2023-11", end: "2023-12", date: "2023년 11월–12월", kind: "range", description: "뉴스레터의 레이아웃과 로고 등을 리디자인했습니다." },
    { id: "ajou", title: "아주대학교 디지털미디어학과 입학", start: "2024-03", date: "2024년 3월", kind: "event", description: "디자인과 개발이 융합된 디지털미디어학과에 입학했습니다." },
    { id: "asa-join", title: "중앙사진동아리 A.SA. 입부", start: "2024-03", date: "2024년 3월", kind: "event", description: "중앙사진동아리 A.SA.에 입부했습니다." },
    { id: "asa-design", title: "A.SA. 제작부장", start: "2025-01", end: "2026-06", date: "2025년 1월–2026년 6월", kind: "range", description: "제작부장으로 포스터, 굿즈, 도록을 디자인했습니다." },
    { id: "newsletter-workshop", title: "뭐지 뉴스레터 워크샵", start: "2026-08", date: "2026년 8월", kind: "event", description: "뭐지 뉴스레터 워크샵." }
  ];

  var phases = [
    { title: "개발자를 꿈꾸던 시기", start: Date.UTC(2016, 0, 1), end: Date.UTC(2021, 2, 1) },
    { title: "디자인 탐색기", start: Date.UTC(2021, 2, 1), end: Date.UTC(2025, 0, 1) },
    { title: "현재", start: Date.UTC(2025, 0, 1), end: LAST + DAY }
  ];

  function element(tag, className, text) {
    var item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  }

  function monthStart(value) {
    var parts = value.split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, 1);
  }

  function monthEnd(value) {
    var parts = value.split("-").map(Number);
    return Date.UTC(parts[0], parts[1], 0);
  }

  function dateKey(value) {
    return new Date(value).toISOString().slice(0, 10);
  }

  function calendarLabel(value) {
    var date = new Date(value);
    return date.getUTCFullYear() + "년 " + (date.getUTCMonth() + 1) + "월 " + date.getUTCDate() + "일 달력 칸";
  }

  function columnOf(value) {
    if (value < CALENDAR_FIRST) return 0;
    return SUMMARY_COLUMNS + Math.floor((value - GRID_START) / DAY / 7);
  }

  activities.forEach(function (activity) {
    activity.first = monthStart(activity.start);
    activity.last = monthEnd(activity.end || activity.start);
  });

  root.style.setProperty("--graph-columns", String(SUMMARY_COLUMNS + WEEK_COUNT));
  root.style.setProperty("--graph-weeks", String(WEEK_COUNT));
  root.style.setProperty("--graph-summary-columns", String(SUMMARY_COLUMNS));
  var instructions = element("p", "graph-sr-only", "2016년부터 2020년까지는 대표 활동을 한 묶음으로 축약했습니다. 오른쪽 방향키로 요약에서 2021년 달력으로 이동합니다. 2021년부터는 좌우 방향키로 이전·다음 주, 위아래 방향키로 요일을 이동합니다. Home과 End는 해당 주의 처음과 끝, Control 또는 Command와 함께 누르면 전체 기록의 처음과 끝으로 이동합니다. Enter 또는 Space로 말풍선을 열거나 닫고 Escape로 닫습니다. 표시된 칸의 일자는 시각화용이며 실제 활동 시점은 말풍선의 연도·월을 참고하세요.");
  instructions.id = "activity-graph-instructions";
  var scroll = element("div", "graph-scroll");
  var sheet = element("div", "graph-sheet");
  var phaseAxis = element("div", "graph-phase-axis");
  phaseAxis.setAttribute("aria-hidden", "true");
  phases.forEach(function (phase) {
    var band = element("div", "graph-phase-label", phase.title);
    band.style.setProperty("--graph-column", String(columnOf(phase.start)));
    band.style.setProperty("--graph-span", String(columnOf(phase.end - DAY) - columnOf(phase.start) + 1));
    phaseAxis.append(band);
  });
  var yearAxis = element("div", "graph-year-axis");
  yearAxis.setAttribute("aria-hidden", "true");
  var summaryLabel = element("span", "graph-year-label", "2016–2020 · 축약");
  summaryLabel.style.setProperty("--graph-column", "0");
  yearAxis.append(summaryLabel);
  for (var year = 2021; year <= 2026; year++) {
    var label = element("span", "graph-year-label", String(year));
    label.style.setProperty("--graph-column", String(columnOf(Date.UTC(year, 0, 1))));
    yearAxis.append(label);
  }

  var surface = element("div", "graph-surface");
  var prefix = element("div", "graph-prefix");
  var summary = element("button", "graph-summary");
  summary.type = "button";
  summary.setAttribute("aria-describedby", instructions.id);
  summary.dataset.date = dateKey(FIRST);
  summary.graphTime = FIRST;
  summary.graphRecords = activities.filter(function (activity) { return activity.first < CALENDAR_FIRST; });
  summary.setAttribute("aria-label", "2016년부터 2020년까지의 활동 요약. " + summary.graphRecords.map(function (activity) {
    return activity.title + ", " + activity.date + (activity.important ? ", " + activity.important : "");
  }).join(". "));
  summary.tabIndex = 0;
  // These are decorative summary squares, not individual calendar days.
  for (var summaryColumn = 0; summaryColumn < 6; summaryColumn++) {
    for (var summaryRow = 0; summaryRow < 7; summaryRow++) {
      var square = element("span", "graph-cell " + (summaryColumn === 0 || summaryColumn === 5 ? "is-endpoint" : "is-middle"));
      square.style.gridColumn = String(summaryColumn + 1);
      square.style.gridRow = String(summaryRow + 1);
      square.setAttribute("aria-hidden", "true");
      if (summaryColumn === 0 && summaryRow === 0) square.classList.add("is-important");
      summary.append(square);
    }
  }
  var breakMark = element("span", "graph-compression-mark", "//");
  breakMark.setAttribute("aria-hidden", "true");
  prefix.append(summary, breakMark);

  var grid = element("div", "graph-grid");
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", "2021년부터 2026년까지의 활동 달력");
  grid.setAttribute("aria-rowcount", "7");
  grid.setAttribute("aria-colcount", String(WEEK_COUNT));
  grid.setAttribute("aria-describedby", instructions.id);
  var weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  var rows = weekdays.map(function (weekday, index) {
    var row = element("div", "graph-weekday-row");
    row.setAttribute("role", "row");
    row.setAttribute("aria-label", weekday);
    row.setAttribute("aria-rowindex", String(index + 1));
    grid.append(row);
    return row;
  });
  var cells = [summary];
  var cellsByDate = new Map([[FIRST, summary]]);
  for (var offset = 0; offset < WEEK_COUNT * 7; offset++) {
    var time = GRID_START + offset * DAY;
    var weekdayIndex = offset % 7;
    var columnIndex = Math.floor(offset / 7);
    var cell = element("div", "graph-cell");
    cell.style.gridColumn = String(columnIndex + 1);
    cell.style.gridRow = String(weekdayIndex + 1);
    if (time < CALENDAR_FIRST || time > LAST) {
      cell.classList.add("is-padding");
      cell.setAttribute("aria-hidden", "true");
      rows[weekdayIndex].append(cell);
      continue;
    }
    var records = activities.filter(function (activity) { return time >= activity.first && time <= activity.last; });
    var endpoint = records.some(function (activity) {
      return activity.kind === "event" || time < activity.first + 7 * DAY || time > activity.last - 7 * DAY;
    });
    var important = records.some(function (activity) { return activity.important && time === activity.first; });
    var level = endpoint ? "endpoint" : records.length ? "middle" : "empty";
    cell.classList.add("is-" + level);
    if (important) cell.classList.add("is-important");
    cell.dataset.date = dateKey(time);
    cell.dataset.level = level;
    cell.dataset.activities = records.map(function (activity) { return activity.id; }).join(" ");
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-colindex", String(columnIndex + 1));
    cell.setAttribute("aria-label", calendarLabel(time) + ". " + (records.length ? records.map(function (activity) { return activity.title + ", " + activity.date + (activity.important ? ", " + activity.important : ""); }).join(". ") : "등록된 활동 기록 없음"));
    cell.tabIndex = -1;
    cell.graphTime = time;
    cell.graphRecords = records;
    cells.push(cell);
    cellsByDate.set(time, cell);
    rows[weekdayIndex].append(cell);
  }
  surface.append(prefix, grid);
  sheet.append(phaseAxis, yearAxis, surface);
  scroll.append(sheet);

  var accessibleList = element("ul", "graph-sr-only");
  accessibleList.setAttribute("aria-label", "전체 활동 기록");
  activities.forEach(function (activity) {
    accessibleList.append(element("li", "", activity.date + ": " + activity.title + ". " + activity.description + (activity.important ? " " + activity.important + "." : "")));
  });
  var activityStatus = element("p", "graph-sr-only");
  activityStatus.setAttribute("role", "status");
  activityStatus.setAttribute("aria-live", "polite");
  activityStatus.setAttribute("aria-atomic", "true");
  root.append(instructions, scroll, accessibleList, activityStatus);

  // The tooltip lives outside the scrolling viewport so it cannot be clipped.
  var tooltip = element("div", "graph-tooltip");
  tooltip.id = "activity-graph-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);
  var currentCell = cells[0];
  var activeCell = null;
  var dismissedCell = null;
  var pinnedCell = null;
  var hoveredCell = null;
  var tooltipHovered = false;
  var hideTimer = 0;
  var positionFrame = 0;

  function graphCell(target) {
    return target instanceof Element ? target.closest(".graph-cell[data-date], .graph-summary") : null;
  }

  function setCurrent(cell) {
    if (currentCell !== cell) currentCell.tabIndex = -1;
    currentCell = cell;
    currentCell.tabIndex = 0;
  }

  function resetDescription(cell) {
    if (cell === summary) cell.setAttribute("aria-describedby", instructions.id);
    else cell.removeAttribute("aria-describedby");
  }

  function hideTooltip() {
    window.clearTimeout(hideTimer);
    dismissedCell = activeCell || dismissedCell;
    if (activeCell) resetDescription(activeCell);
    activeCell = null;
    pinnedCell = null;
    tooltip.hidden = true;
  }

  function placeTooltip() {
    positionFrame = 0;
    if (!activeCell) return;
    var anchor = activeCell.getBoundingClientRect();
    var viewport = scroll.getBoundingClientRect();
    var visibleViewport = window.visualViewport;
    var width = visibleViewport ? visibleViewport.width : window.innerWidth;
    var height = visibleViewport ? visibleViewport.height : window.innerHeight;
    var viewLeft = visibleViewport ? visibleViewport.offsetLeft : 0;
    var viewTop = visibleViewport ? visibleViewport.offsetTop : 0;
    var visible = root.getClientRects().length && anchor.right > viewport.left && anchor.left < viewport.right && anchor.bottom > viewTop && anchor.top < viewTop + height;
    if (!visible) {
      tooltip.hidden = true;
      return;
    }
    tooltip.hidden = false;
    tooltip.style.maxWidth = Math.max(1, Math.min(340, width - 24)) + "px";
    tooltip.style.maxHeight = Math.max(1, height - 24) + "px";
    var box = tooltip.getBoundingClientRect();
    var left = Math.max(viewLeft + 12, Math.min(anchor.left + anchor.width / 2 - box.width / 2, viewLeft + width - box.width - 12));
    var top = anchor.top - box.height - 12;
    if (top < viewTop + 12) top = anchor.bottom + 12;
    top = Math.max(viewTop + 12, Math.min(top, viewTop + height - box.height - 12));
    tooltip.style.left = Math.round(left) + "px";
    tooltip.style.top = Math.round(top) + "px";
  }

  function schedulePosition() {
    if (!positionFrame) positionFrame = window.requestAnimationFrame(placeTooltip);
  }

  function showTooltip(cell) {
    window.clearTimeout(hideTimer);
    dismissedCell = null;
    if (activeCell && activeCell !== cell) resetDescription(activeCell);
    activeCell = cell;
    tooltip.replaceChildren();
    if (!cell.graphRecords.length) {
      var date = new Date(cell.graphTime);
      tooltip.append(element("p", "graph-tooltip-date", date.getUTCFullYear() + "년 " + (date.getUTCMonth() + 1) + "월"), element("p", "graph-tooltip-description", "등록된 활동 기록이 없습니다."));
    }
    cell.graphRecords.forEach(function (activity) {
      var item = element("div", "graph-tooltip-item");
      item.append(element("p", "graph-tooltip-date", activity.date), element("p", "graph-tooltip-title", activity.title), element("p", "graph-tooltip-description", activity.description));
      if (activity.important) item.append(element("p", "graph-tooltip-highlight", activity.important));
      tooltip.append(item);
    });
    cell.setAttribute("aria-describedby", (cell === summary ? instructions.id + " " : "") + tooltip.id);
    placeTooltip();
  }

  function deferHide() {
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(function () {
      if (pinnedCell || hoveredCell || tooltipHovered) return;
      var focused = graphCell(document.activeElement);
      if (focused && focused !== dismissedCell && root.contains(focused)) showTooltip(focused);
      else hideTooltip();
    }, 150);
  }

  function revealCell(cell, smooth) {
    var cellRect = cell.getBoundingClientRect();
    var viewport = scroll.getBoundingClientRect();
    var target = scroll.scrollLeft;
    if (cellRect.left < viewport.left + 6) target -= viewport.left + 6 - cellRect.left;
    else if (cellRect.right > viewport.right - 6) target += cellRect.right - viewport.right + 6;
    scroll.scrollTo({ left: target, behavior: smooth && !reducedMotion.matches ? "smooth" : "instant" });
  }

  surface.addEventListener("pointerover", function (event) {
    if (event.pointerType !== "mouse") return;
    var cell = graphCell(event.target);
    if (!cell || cell === hoveredCell) return;
    hoveredCell = cell;
    pinnedCell = null;
    showTooltip(cell);
  });
  surface.addEventListener("pointerleave", function (event) {
    if (event.pointerType !== "mouse") return;
    hoveredCell = null;
    deferHide();
  });
  surface.addEventListener("focusin", function (event) {
    var cell = graphCell(event.target);
    if (!cell) return;
    setCurrent(cell);
    revealCell(cell, false);
    showTooltip(cell);
  });
  surface.addEventListener("focusout", deferHide);
  surface.addEventListener("click", function (event) {
    var cell = graphCell(event.target);
    if (!cell) return;
    setCurrent(cell);
    if (pinnedCell === cell) hideTooltip();
    else {
      pinnedCell = cell;
      showTooltip(cell);
    }
  });
  surface.addEventListener("keydown", function (event) {
    var cell = graphCell(event.target);
    if (!cell) return;
    var date = cell.graphTime;
    var weekday = new Date(date).getUTCDay();
    var nextDate = date;
    if (event.key === "ArrowLeft") nextDate = cell === summary || date - 7 * DAY < CALENDAR_FIRST ? FIRST : date - 7 * DAY;
    else if (event.key === "ArrowRight") nextDate = cell === summary ? CALENDAR_FIRST : date + 7 * DAY;
    else if (event.key === "ArrowUp") nextDate = cell === summary ? FIRST : Math.max(CALENDAR_FIRST, date - (weekday > 0 ? DAY : 0));
    else if (event.key === "ArrowDown") nextDate = cell === summary ? FIRST : date + (weekday < 6 ? DAY : 0);
    else if (event.key === "Home") nextDate = event.ctrlKey || event.metaKey || cell === summary ? FIRST : Math.max(CALENDAR_FIRST, date - weekday * DAY);
    else if (event.key === "End") nextDate = event.ctrlKey || event.metaKey ? LAST : cell === summary ? FIRST : date + (6 - weekday) * DAY;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (pinnedCell === cell) hideTooltip();
      else { pinnedCell = cell; showTooltip(cell); }
      return;
    } else return;
    event.preventDefault();
    nextDate = Math.max(FIRST, Math.min(LAST, nextDate));
    var nextCell = cellsByDate.get(nextDate);
    pinnedCell = null;
    hoveredCell = null;
    setCurrent(nextCell);
    nextCell.focus({ preventScroll: true });
  });
  tooltip.addEventListener("pointerenter", function () { tooltipHovered = true; window.clearTimeout(hideTimer); });
  tooltip.addEventListener("pointerleave", function () { tooltipHovered = false; deferHide(); });
  document.addEventListener("pointerdown", function (event) {
    if (!graphCell(event.target) && !tooltip.contains(event.target)) hideTooltip();
  });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape") hideTooltip(); });
  scroll.addEventListener("scroll", schedulePosition, { passive: true });
  window.addEventListener("scroll", schedulePosition, { passive: true });
  window.addEventListener("resize", schedulePosition);
  window.addEventListener("hashchange", hideTooltip);
  document.addEventListener("portfolio:pagechange", hideTooltip);
  document.addEventListener("visibilitychange", hideTooltip);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", schedulePosition);
    window.visualViewport.addEventListener("scroll", schedulePosition);
  }

  var milestones = activities.filter(function (activity, index, list) {
    return list.findIndex(function (other) { return other.first === activity.first; }) === index;
  });

  function nextActivity() {
    var computed = getComputedStyle(root);
    var step = parseFloat(computed.getPropertyValue("--graph-cell")) + parseFloat(computed.getPropertyValue("--graph-gap"));
    var next = milestones.find(function (activity) { return activity.first > currentCell.graphTime; }) || milestones[0];
    var cell = cellsByDate.get(next.first);
    var maxLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
    var left = Math.min(maxLeft, Math.max(0, columnOf(next.first) * step - 6));
    hoveredCell = null;
    pinnedCell = cell;
    setCurrent(cell);
    scroll.scrollTo({ left: left, behavior: reducedMotion.matches ? "instant" : "smooth" });
    showTooltip(cell);
    activityStatus.textContent = activities.filter(function (activity) {
      return activity.first === next.first;
    }).map(function (activity) {
      return activity.title + ", " + activity.date;
    }).join(". ") + ".";
  }

  document.querySelectorAll("[data-graph-next]").forEach(function (button) { button.addEventListener("click", nextActivity); });
  window.portfolioGraph = { closeTooltip: hideTooltip, nextActivity: nextActivity };
}());
