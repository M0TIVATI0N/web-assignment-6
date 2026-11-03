/* Run from the project root: node scripts/browser-tests.cjs
 * Playwright is a development-only test dependency; no library is added to the app.
 * Expected answers are hand checked against the assignment's picture. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  pathToFileURL
} = require('node:url');
const {
  isDeepStrictEqual
} = require('node:util');
const {
  chromium
} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'report');
const screenshotDir = path.join(reportDir, 'screenshots');
fs.mkdirSync(screenshotDir, {
  recursive: true
});
const evidence = {
  generatedAt: new Date().toISOString(),
  checks: [],
  cases: [],
  task2Cases: [],
  consoleErrors: [],
  failedRequests: [],
  externalRequests: []
};
const expectedCases = {
  1: ['Arman', 'Sophia', 'Dias', 'Bekzat', 'Aruzhan', 'Saule'],
  2: ['Arman', 'Sophia', 'Bekzat', 'Sergey', 'Natasha', 'Inkar'],
  3: ['Aigerim', 'Ivan', 'Sophia', 'Dias', 'Aruzhan'],
  4: ['Madina', 'Arman', 'Bekzat', 'Saule', 'Emma', 'Timur', 'Yerlan', 'Daniel', 'Zarina', 'Inkar'],
  5: ['Dias', 'Sergey', 'Natasha'],
  6: ['Aliya', 'Sophia', 'Aruzhan', 'Nurlan', 'Yerlan', 'Askar'],
  7: ['Aigerim', 'Arman', 'Bekzat', 'Sergey', 'Natasha', 'Askar'],
  8: ['Aliya', 'Madina', 'Saule', 'Zarina'],
  9: ['Natasha', 'Inkar'],
  10: ['Ivan', 'Saule', 'Kamila', 'Inkar'],
  11: ['Madina', 'Dias', 'Timur', 'Natasha'],
  12: ['Sergey', 'Yerlan', 'Kamila'],
  13: ['Aigerim', 'Madina', 'Nurlan', 'Natasha'],
  14: ['Hall'],
  15: ['Balcony', 'Living room'],
  16: ['Balcony'],
  17: ['Ivan', 'Dias', 'Nurlan', 'Daniel'],
  18: ['Miras'],
  19: ['Natasha'],
  20: ['Zarina']
};
const pictureLiving = ['daniel', 'zarina', 'natasha', 'askar', 'inkar'];
const sortedLiving = ['daniel', 'inkar', 'natasha', 'askar', 'zarina'];
const allOriginalIds = ['aigerim', 'aliya', 'madina', 'ivan', 'arman', 'sophia', 'dias', 'bekzat', 'aruzhan',
  'saule', 'nurlan', 'emma', 'timur', 'sergey', 'yerlan', 'kamila', 'daniel', 'zarina', 'natasha', 'askar',
  'inkar'
];

function record(name, expected, observed) {
  const passed = isDeepStrictEqual(expected, observed);
  evidence.checks.push({
    name,
    passed,
    expected,
    observed
  });
  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${name}${passed ? '' : '\n  expected ' + JSON.stringify(expected) + '\n  observed ' + JSON.stringify(observed)}`
    );
  return passed;
}

async function settle(page) {
  await page.waitForTimeout(50);
  await page.waitForFunction(() => window.jQuery && jQuery(':animated').length === 0 && jQuery(
    '.flight-clone,.sort-flight,.move-slot').length === 0, null, {
    timeout: 10000
  });
}

async function snapshot(page, filename) {
  await page.screenshot({
    path: path.join(screenshotDir, filename),
    fullPage: true
  });
}

async function idsIn(page, room) {
  return page.locator('#' + room + ' .guest-list > .guest').evaluateAll(nodes => nodes.map(node => node
  .id));
}

async function noQueues(page) {
  return page.evaluate(() => ({
    animated: jQuery(':animated').length,
    queued: jQuery('*').toArray().reduce((sum, node) => sum + jQuery(node).queue('fx').length, 0),
    transientCards: jQuery('.flight-clone,.sort-flight,.move-slot').length
  }));
}

async function brightness(page) {
  return page.locator('.guest-list > .guest').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [
    node.id, Math.round(Number(getComputedStyle(node).opacity) * 100) / 100
  ])));
}

async function reset(page) {
  await page.locator('#reset-btn').click();
  await settle(page);
}

async function guestLayout(page, label) {
  const result = await page.locator('.guest-list > .guest').evaluateAll(nodes => {
    const outside = [],
      overlap = [],
      unloaded = [];
    nodes.forEach(node => {
      const ring = node.querySelector('.avatar-wrap').getBoundingClientRect();
      const img = node.querySelector('.avatar-wrap img');
      const photo = img.getBoundingClientRect();
      const name = node.querySelector('.guest-name').getBoundingClientRect();
      if (!img.complete || img.naturalWidth === 0) unloaded.push(node.id);
      if (photo.left < ring.left - 0.5 || photo.right > ring.right + 0.5 || photo.top < ring.top -
        0.5 || photo.bottom > ring.bottom + 0.5) outside.push(node.id);
      if (name.top < ring.bottom - 0.5) overlap.push(node.id);
    });
    return {
      outside,
      overlap,
      unloaded
    };
  });
  record(label + ': all local avatar files load', [], result.unloaded);
  record(label + ': every avatar stays inside its clothing-color ring', [], result.outside);
  record(label + ': names stay below avatars without overlap', [], result.overlap);
}

async function navigationState(page) {
  return page.evaluate(() => ({
    task: document.body.dataset.task,
    heading: document.querySelector('h1').textContent,
    current: document.querySelector('nav a[aria-current="page"]').textContent,
    isTask2: window.PartyApp.isTask2
  }));
}

async function runtimeScripts(page, label) {
  record(label + ': only jQuery and the three local application scripts run', ['jquery-3.7.1.min.js',
    'data.js', 'cases.js', 'app.js'
  ], await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.src.split('/').at(-
    1))));
}

(async function main() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE || undefined,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage({
    viewport: {
      width: 1600,
      height: 1050
    },
    deviceScaleFactor: 1
  });
  await page.context().setOffline(true);
  page.on('pageerror', error => evidence.consoleErrors.push(error.message));
  page.on('requestfailed', request => evidence.failedRequests.push({
    url: request.url(),
    error: request.failure()?.errorText
  }));
  page.on('request', request => {
    if (/^https?:/.test(request.url())) evidence.externalRequests.push(request.url());
  });

  try {
    await page.goto(pathToFileURL(path.join(root, 'task1/index.html')).href);
    await page.waitForFunction(() => window.PartyApp && jQuery('.guest-list > .guest').length === 21);
    record('Task 1 heading, current navigation link, and behavior flag agree', {
      task: '1',
      heading: 'Task 1: Selector Detective',
      current: 'Task 1: Selector Detective',
      isTask2: false
    }, await navigationState(page));
    await guestLayout(page, 'Task 1 desktop');
    await runtimeScripts(page, 'Task 1');
    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await guestLayout(page, 'Task 1 mobile');
    await page.setViewportSize({
      width: 1600,
      height: 1050
    });
    await page.locator('nav a[href="../task2/index.html"]').click();
    await page.waitForFunction(() => window.PartyApp && window.PartyApp.isTask2 === true);
    record('Task 1 to Task 2 navigation loads the correct heading and behavior', {
      task: '2',
      heading: 'Task 2: Party in Motion',
      current: 'Task 2: Party in Motion',
      isTask2: true
    }, await navigationState(page));
    await guestLayout(page, 'Task 2 desktop');
    await runtimeScripts(page, 'Task 2');
    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await guestLayout(page, 'Task 2 mobile');
    await page.setViewportSize({
      width: 1600,
      height: 1050
    });
    await page.locator('nav a[href="../task1/index.html"]').click();
    await page.waitForFunction(() => window.PartyApp && window.PartyApp.isTask2 === false);
    record('Task 2 to Task 1 navigation restores the correct heading and behavior', {
      task: '1',
      heading: 'Task 1: Selector Detective',
      current: 'Task 1: Selector Detective',
      isTask2: false
    }, await navigationState(page));
    record('Task 1 builds all 21 original guests in picture order', allOriginalIds, await page.locator(
      '.guest-list > .guest').evaluateAll(nodes => nodes.map(node => node.id)));
    record('Task 1 has twenty case buttons', 20, await page.locator('.case-btn').count());

    for (let id = 1; id <= 20; id += 1) {
      await page.locator(`.case-btn[data-case="${id}"]`).click();
      await settle(page);
      const info = await page.evaluate(caseId => {
        const item = window.PartyCases.find(c => c.id === caseId);
        const roomNames = jQuery('.room.is-found').map(function() {
          return jQuery(this).attr('data-name') || jQuery(this).find(
            '.room-heading h3,.room-heading h4').first().text();
        }).get();
        const guestNames = jQuery('.guest-list > .guest.is-found').map(function() {
          return jQuery(this).attr('data-name');
        }).get();
        return {
          title: item.title,
          target: item.target,
          names: item.target === 'rooms' ? roomNames : guestNames,
          resultNames: jQuery('#result-names').text(),
          count: jQuery('.guest-list > .guest').length,
          chain: jQuery('#case-chain').text()
        };
      }, id);
      // The departure case returns the fading element, then removes it. The
      // result panel retains the found name after the card has disappeared.
      if (id === 19) info.names = info.resultNames.includes('Natasha') ? ['Natasha'] : info.names;
      const expected = expectedCases[id];
      const passed = record(`Task 1 case ${id}: ${info.title}`, expected, info.names);
      record(`Task 1 case ${id}: rebuilds the scene before selecting`, id === 18 ? 22 : id === 19 ? 20 :
        21, info.count);
      record(`Task 1 case ${id}: shows its executable jQuery chain`, true, info.chain.trim().length > 5 &&
        !info.chain.startsWith('//'));
      if (id === 18) record('Miras appears between Askar and Inkar', ['daniel', 'zarina', 'natasha',
        'askar', 'miras', 'inkar'
      ], await idsIn(page, 'living-room'));
      if (id === 19) record('Natasha is removed after fading out', 0, await page.locator('#natasha')
        .count());
      const screenshot = `screenshots/task1-case-${String(id).padStart(2, '0')}.png`;
      await snapshot(page, path.basename(screenshot));
      evidence.cases.push({
        id,
        title: info.title,
        target: info.target,
        expected,
        observed: info.names,
        passed,
        screenshot
      });
    }

    await page.goto(pathToFileURL(path.join(root, 'task2/index.html')).href);
    await page.waitForFunction(() => window.PartyApp && window.PartyApp.isTask2 === true && jQuery(
      '.guest-list > .guest').length === 21);
    for (let id = 1; id <= 20; id += 1) {
      await reset(page);
      await page.locator(`.case-btn[data-case="${id}"]`).click();
      await settle(page);
      const result = await page.evaluate(caseId => {
        const item = window.PartyCases.find(c => c.id === caseId);
        const names = item.target === 'rooms' ? jQuery('.room.is-found').map(function() {
          return jQuery(this).attr('data-name');
        }).get() : jQuery('.guest-list > .guest.is-found').map(function() {
          return jQuery(this).attr('data-name');
        }).get();
        return {
          names: caseId === 19 && jQuery('#result-names').text().includes('Natasha') ? ['Natasha'] :
            names,
          count: jQuery('.guest-list > .guest').length
        };
      }, id);
      const passed = record(`Task 2 fresh case ${id}: matches the assignment answer`, expectedCases[id],
        result.names);
      record(`Task 2 fresh case ${id}: has the correct guest count`, id === 18 ? 22 : id === 19 ? 20 : 21,
        result.count);
      evidence.task2Cases.push({
        id,
        expected: expectedCases[id],
        observed: result.names,
        passed
      });
    }
    await reset(page);
    await page.locator('.case-btn[data-case="3"]').click();
    await settle(page);
    record('Task 2 spotlight: upstairs AITU students stay bright and all others fade to 20%', Object
      .fromEntries(allOriginalIds.map(id => [id, ['aigerim', 'ivan', 'sophia', 'dias', 'aruzhan']
        .includes(id) ? 1 : 0.2
      ])), await brightness(page));
    await snapshot(page, 'task2-spotlight.png');
    await page.locator('#clear-btn').click();
    await settle(page);
    record('Task 2 Clear restores every guest to full brightness', Object.fromEntries(allOriginalIds.map(
      id => [id, 1])), await brightness(page));
    await snapshot(page, 'task2-clear.png');

    await page.locator('.case-btn[data-case="14"]').click();
    await settle(page);
    record('A room case keeps every guest in the found room bright', Object.fromEntries(allOriginalIds
      .map(id => [id, ['arman', 'sophia', 'dias', 'bekzat', 'aruzhan', 'saule'].includes(id) ? 1 :
        0.2])), await brightness(page));
    await page.locator('#clear-btn').click();
    await settle(page);

    await page.locator('#arman').click();
    await settle(page);
    const detailText = await page.locator('.guest-detail').innerText();
    record('Guest detail contains Arman, arrival time, clothing, belongings, and student status', true,
      /Arman/.test(detailText) && /20:35/.test(detailText) && /yellow/i.test(detailText) && /bag/i.test(
        detailText) && /glasses/i.test(detailText) && /not an? AITU|not.*AITU|visitor|guest/i.test(
        detailText));
    record('Guest detail offers each of the three other rooms', 3, await page.locator(
      '.guest-detail [data-move-to]').count());
    await snapshot(page, 'task2-details.png');
    await page.keyboard.press('Escape');
    await settle(page);
    record('Escape shrinks and removes the guest detail', 0, await page.locator('.guest-detail').count());

    // Keep both cards physically exposed while the centered panel is open.
    // This verifies genuine pointer behavior instead of synthetic events.
    await page.setViewportSize({
      width: 1600,
      height: 1800
    });
    await page.locator('#arman').click();
    await settle(page);
    await page.locator('#sophia').click();
    await settle(page);
    record('A real pointer click on another exposed guest switches the open detail', {
      count: 1,
      latest: true
    }, {
      count: await page.locator('.guest-detail').count(),
      latest: /Sophia/.test(await page.locator('.guest-detail').innerText())
    });
    await page.keyboard.press('Escape');
    await settle(page);
    await page.setViewportSize({
      width: 1600,
      height: 1050
    });

    await page.locator('#arman').click();
    await settle(page);
    await page.locator('.detail-backdrop').click({
      position: {
        x: 5,
        y: 5
      },
      force: true
    });
    await settle(page);
    record('Clicking outside the guest detail closes it', 0, await page.locator('.guest-detail').count());

    await page.evaluate(() => {
      jQuery('#arman').trigger('click');
      jQuery('#sophia').trigger('click');
      jQuery('#dias').trigger('click');
    });
    await settle(page);
    record('Fast guest switches leave only the most recently requested detail open', {
      count: 1,
      latest: true
    }, {
      count: await page.locator('.guest-detail').count(),
      latest: /Dias/.test(await page.locator('.guest-detail').innerText())
    });
    await page.keyboard.press('Escape');
    await settle(page);

    await page.locator('#arman').click();
    await settle(page);
    await page.evaluate(() => {
      jQuery('#sophia').trigger('click');
      jQuery(document.body).trigger('click');
    });
    await settle(page);
    await page.waitForTimeout(500);
    record('An outside click during a guest switch cancels the pending new detail', 0, await page.locator(
      '.guest-detail').count());

    await page.evaluate(() => {
      window.PartyApp.runCase(18);
      jQuery('#miras').trigger('click');
    });
    await settle(page);
    record('Clicking Miras immediately during arrival opens his synchronized guest detail', {
      count: 1,
      miras: true
    }, {
      count: await page.locator('.guest-detail').count(),
      miras: /Miras/.test(await page.locator('.guest-detail').innerText())
    });
    await page.keyboard.press('Escape');
    await settle(page);
    await reset(page);

    await page.locator('#arman').click();
    await settle(page);
    await page.evaluate(() => {
      window.__moveTrace = [];
      const sample = () => {
        const flight = document.querySelector('.flight-clone');
        if (flight) {
          const rect = flight.getBoundingClientRect();
          window.__moveTrace.push({
            left: rect.left,
            top: rect.top,
            width: rect.width,
            slots: {
              old: jQuery('#hall .move-slot').outerWidth(),
              incoming: jQuery('#balcony .move-slot').outerWidth()
            }
          });
        }
        if (!window.__moveTrace.length || flight) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.locator('.guest-detail [data-move-to="balcony"]').click();
    await page.waitForTimeout(120);
    record('Moving creates an animated flying card before arrival', true, await page.evaluate(() =>
      jQuery('.flight-clone:animated').length > 0 || jQuery('#arman:animated').length > 0));
    await settle(page);
    const moveGeometry = await page.evaluate(() => {
      const trace = window.__moveTrace;
      const rect = document.getElementById('arman').getBoundingClientRect();
      const first = trace[0];
      const last = trace[trace.length - 1];
      return {
        frameCount: trace.length,
        distance: Math.hypot(first.left - last.left, first.top - last.top),
        endpointError: Math.hypot(rect.left - last.left, rect.top - last.top),
        closingSlotWidths: trace.filter(frame => Number.isFinite(frame.slots.old)).map(frame => frame
          .slots.old),
        openingSlotWidths: trace.filter(frame => Number.isFinite(frame.slots.incoming)).map(frame =>
          frame.slots.incoming)
      };
    });
    record('Moving crosses the house over multiple frames and finishes at the actual destination', {
      severalFrames: true,
      traveled: true,
      accurateEndpoint: true
    }, {
      severalFrames: moveGeometry.frameCount >= 5,
      traveled: moveGeometry.distance > 30,
      accurateEndpoint: moveGeometry.endpointError < 4
    });
    record('The old gap shrinks and the new gap grows over intermediate animation frames', {
      oldGapCloses: true,
      newGapOpens: true
    }, {
      oldGapCloses: moveGeometry.closingSlotWidths.some((width, index, values) => index > 0 && width >
        0 && width < values[0] - 2),
      newGapOpens: moveGeometry.openingSlotWidths.some((width, index, values) => index > 0 && width >
        values[0] + 2 && width < values.at(-1))
    });
    evidence.moveGeometry = moveGeometry;
    record('Arman arrives at the end of the balcony', ['aigerim', 'aliya', 'madina', 'ivan', 'arman'],
      await idsIn(page, 'balcony'));
    record('The hall closes Arman’s old place', ['sophia', 'dias', 'bekzat', 'aruzhan', 'saule'],
      await idsIn(page, 'hall'));
    record('Moving updates the party array', 'balcony', await page.evaluate(() => window.PartyApp
      .getState().find(room => room.guests.some(guest => guest.id === 'arman'))?.id));
    await snapshot(page, 'task2-move.png');
    await page.locator('.case-btn[data-case="1"]').click();
    await settle(page);
    record('Case 1 after moving no longer finds Arman', ['sophia', 'dias', 'bekzat', 'aruzhan', 'saule'],
      await page.locator('.guest.is-found').evaluateAll(nodes => nodes.map(node => node.id)));
    record('Case rebuild keeps the moved guest in the new room', ['aigerim', 'aliya', 'madina', 'ivan',
      'arman'
    ], await idsIn(page, 'balcony'));

    await reset(page);
    await page.locator('#living-room .sort-btn').click();
    await settle(page);
    record('Living room first sort is ascending by arrival time', sortedLiving, await idsIn(page,
      'living-room'));
    await snapshot(page, 'task2-sort.png');
    await page.locator('#living-room .sort-btn').click();
    await settle(page);
    record('Living room second sort restores picture order', pictureLiving, await idsIn(page,
      'living-room'));
    const interruptedSort = await page.evaluate(async () => {
      jQuery('#living-room .sort-btn').trigger('click');
      await new Promise(resolve => setTimeout(resolve, 150));
      const positions = () => Object.fromEntries(jQuery('.sort-flight').toArray().map(node => {
        const rect = node.getBoundingClientRect();
        return [node.dataset.name, {
          left: rect.left,
          top: rect.top
        }];
      }));
      const before = positions();
      jQuery('#living-room .sort-btn').trigger('click');
      const after = positions();
      return {
        before,
        after,
        jumps: Object.fromEntries(Object.keys(before).map(name => [name, after[name] ? Math.hypot(
          before[name].left - after[name].left, before[name].top - after[name].top) : null]))
      };
    });
    evidence.interruptedSortGeometry = interruptedSort;
    record('Reversing a sort after 150ms continues from every card’s current position without a jump', {
      cards: 5,
      allContinuous: true
    }, {
      cards: Object.keys(interruptedSort.jumps).length,
      allContinuous: Object.values(interruptedSort.jumps).every(distance => distance !== null &&
        distance < 3)
    });
    await settle(page);
    record('An interrupted sort reversal still finishes in picture order', pictureLiving, await idsIn(
      page, 'living-room'));
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) jQuery('#living-room .sort-btn').trigger('click');
    });
    await settle(page);
    record('Five very fast sort clicks end in sorted order', sortedLiving, await idsIn(page,
      'living-room'));
    record('Fast sort clicks leave no animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));

    await page.locator('#living-room .sort-btn').click();
    await settle(page);
    const spacedSort = await page.evaluate(async () => {
      const samples = [];
      const positions = () => Object.fromEntries(jQuery('.sort-flight').toArray().map(node => {
        const rect = node.getBoundingClientRect();
        return [node.dataset.name, {
          left: rect.left,
          top: rect.top
        }];
      }));
      for (let click = 0; click < 5; click++) {
        const before = positions();
        jQuery('#living-room .sort-btn').trigger('click');
        const after = positions();
        if (click > 0) samples.push(Object.keys(before).map(name => after[name] ? Math.hypot(before[
          name].left - after[name].left, before[name].top - after[name].top) : null));
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      return samples;
    });
    evidence.spacedSortGeometry = spacedSort;
    record('Five sort clicks 40ms apart preserve all visible card positions at each reversal', {
      interruptions: 4,
      allContinuous: true
    }, {
      interruptions: spacedSort.length,
      allContinuous: spacedSort.every(sample => sample.length === 5 && sample.every(distance =>
        distance !== null && distance < 3))
    });
    await settle(page);
    record('Five sort clicks 40ms apart finish in sorted order', sortedLiving, await idsIn(page,
      'living-room'));

    await page.locator('.case-btn[data-case="19"]').click();
    await settle(page);
    await page.locator('#living-room .sort-btn').click();
    await settle(page);
    record('Removing Natasha from a sorted room preserves the original picture-order toggle', ['daniel',
      'zarina', 'askar', 'inkar'
    ], await idsIn(page, 'living-room'));
    await reset(page);

    await page.evaluate(() => {
      for (let i = 0; i < 30; i++) {
        jQuery(`.case-btn[data-case="${i % 20 + 1}"]`).trigger('click');
        if (i % 3 === 0) jQuery('#clear-btn').trigger('click');
      }
      jQuery('.case-btn[data-case="20"]').trigger('click');
    });
    await settle(page);
    record('Fast mixed case and Clear clicks finish with the last requested result', ['zarina'],
      await page.locator('.guest.is-found').evaluateAll(nodes => nodes.map(node => node.id)));
    record('Fast cases leave no animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));

    await reset(page);
    await page.evaluate(() => {
      jQuery('.case-btn[data-case="18"]').trigger('click');
      jQuery('.case-btn[data-case="18"]').trigger('click');
    });
    await settle(page);
    record('Repeated arrival clicks create exactly one Miras', {
      count: 22,
      miras: 1,
      unique: 22
    }, await page.evaluate(() => {
      const ids = jQuery('.guest-list > .guest').map(function() {
        return this.id;
      }).get();
      return {
        count: ids.length,
        miras: ids.filter(id => id === 'miras').length,
        unique: new Set(ids).size
      };
    }));
    record('Repeated arrival clicks keep the model consistent', {
      count: 22,
      miras: 1
    }, await page.evaluate(() => {
      const guests = window.PartyApp.getState().flatMap(room => room.guests);
      return {
        count: guests.length,
        miras: guests.filter(guest => guest.id === 'miras').length
      };
    }));
    await page.evaluate(() => {
      jQuery('.case-btn[data-case="19"]').trigger('click');
      jQuery('.case-btn[data-case="19"]').trigger('click');
    });
    await settle(page);
    record('Repeated departure clicks remove only Natasha', {
      count: 21,
      natasha: 0,
      miras: 1,
      unique: 21
    }, await page.evaluate(() => {
      const ids = jQuery('.guest-list > .guest').map(function() {
        return this.id;
      }).get();
      return {
        count: ids.length,
        natasha: ids.filter(id => id === 'natasha').length,
        miras: ids.filter(id => id === 'miras').length,
        unique: new Set(ids).size
      };
    }));
    record('Repeated mutations leave no animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));

    await reset(page);
    await page.evaluate(() => {
      jQuery('.case-btn[data-case="19"]').trigger('click');
      jQuery('#clear-btn').trigger('click');
    });
    await settle(page);
    record('Clear during the departure jump completes Natasha’s removal and synchronizes the model', {
      count: 20,
      natasha: 0,
      modelCount: 20,
      modelNatasha: 0
    }, await page.evaluate(() => {
      const guests = window.PartyApp.getState().flatMap(room => room.guests);
      return {
        count: jQuery('.guest-list > .guest').length,
        natasha: jQuery('#natasha').length,
        modelCount: guests.length,
        modelNatasha: guests.filter(guest => guest.id === 'natasha').length
      };
    }));
    record('Interrupted departure leaves no animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));
    await reset(page);
    await page.evaluate(() => {
      jQuery('.case-btn[data-case="18"]').trigger('click');
      jQuery('#clear-btn').trigger('click');
    });
    await settle(page);
    record('Clear during arrival retains exactly one Miras and synchronizes the model', {
      count: 22,
      miras: 1,
      modelCount: 22,
      modelMiras: 1
    }, await page.evaluate(() => {
      const guests = window.PartyApp.getState().flatMap(room => room.guests);
      return {
        count: jQuery('.guest-list > .guest').length,
        miras: jQuery('[id="miras"]').length,
        modelCount: guests.length,
        modelMiras: guests.filter(guest => guest.id === 'miras').length
      };
    }));
    record('Interrupted arrival leaves no animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));

    await reset(page);
    await page.evaluate(() => {
      jQuery('#living-room .sort-btn').trigger('click');
      jQuery('.case-btn[data-case="3"]').trigger('click');
      jQuery('#clear-btn').trigger('click');
      jQuery('#reset-btn').trigger('click');
    });
    await settle(page);
    record('Sort, case, Clear, and Reset during animation restore the original scene', allOriginalIds,
      await page.locator('.guest-list > .guest').evaluateAll(nodes => nodes.map(node => node.id)));
    record('Reset cancels outstanding effects and restores brightness', Object.fromEntries(allOriginalIds
      .map(id => [id, 1])), await brightness(page));
    record('Reset leaves no stale flying cards or animation queues', {
      animated: 0,
      queued: 0,
      transientCards: 0
    }, await noQueues(page));

    await page.setViewportSize({
      width: 390,
      height: 844
    });
    await page.waitForTimeout(100);
    record('Mobile layout fits a 390px screen without horizontal overflow', true, await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
    record('Mobile layout retains all guest cards', 21, await page.locator('.guest-list > .guest')
    .count());
    await snapshot(page, 'task2-mobile.png');

    await page.setViewportSize({
      width: 390,
      height: 340
    });
    await page.locator('#arman').click();
    await settle(page);
    record('A short 340px viewport keeps the dialog inside the screen and makes its content scrollable', {
      insideViewport: true,
      scrollable: true
    }, await page.locator('.guest-detail').evaluate(node => {
      const rect = node.getBoundingClientRect();
      return {
        insideViewport: rect.top >= 0 && rect.bottom <= innerHeight + 1,
        scrollable: getComputedStyle(node).overflowY === 'auto' && node.scrollHeight > node
          .clientHeight
      };
    }));
    await page.locator('.guest-detail [data-move-to]').last().scrollIntoViewIfNeeded();
    record('The final move button remains reachable on a short screen', true, await page.locator(
      '.guest-detail [data-move-to]').last().evaluate(node => {
      const rect = node.getBoundingClientRect(),
        panel = node.closest('.guest-detail').getBoundingClientRect();
      return rect.top >= panel.top && rect.bottom <= panel.bottom;
    }));
    await page.keyboard.press('Escape');
    await settle(page);
    record('Browser has no uncaught JavaScript errors', [], evidence.consoleErrors);
    record('All pages, avatars, and scripts load with no failed asset requests while offline', [],
      evidence.failedRequests);
    record('The application makes no network requests and works completely offline', [], evidence
      .externalRequests);
  } catch (error) {
    record('Browser test run completes', 'No exception', error.stack || error.message);
    await snapshot(page, 'test-failure.png').catch(() => {});
  } finally {
    evidence.summary = {
      passed: evidence.checks.filter(check => check.passed).length,
      failed: evidence.checks.filter(check => !check.passed).length,
      cases: evidence.cases.length
    };
    fs.writeFileSync(path.join(reportDir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
    await browser.close();
    console.log(
      `\n${evidence.summary.passed} passed; ${evidence.summary.failed} failed. Evidence saved to report/evidence.json.`
      );
    if (evidence.summary.failed) process.exitCode = 1;
  }
}());
