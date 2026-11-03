/* Task 1 and its Task 2 copy use jQuery for rendering, events and every effect. */
(function ($) {
  'use strict';

  $(function () {
    const isTask2 = $('body').attr('data-task') === '2';
    const colors = { red: '#db6469', blue: '#4b7fc7', green: '#438f72', black: '#323943', yellow: '#d6a42d', purple: '#9365b6' };
    const icons = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };
    const itemWords = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };
    let party;
    let pictureOrders;
    let sorted = {};
    let finishLayout = null;
    let finishMutation = null;
    let detail = null;
    let detailVersion = 0;

    function copy(value) { return $.extend(true, Array.isArray(value) ? [] : {}, value); }
    function minutes(time) { const parts = time.split(':'); return Number(parts[0]) * 60 + Number(parts[1]); }
    function announce(message) { $('#status').text(message); }
    function roomById(id) { return party.find(function (room) { return room.id === id; }); }
    function guestById(id) {
      for (const room of party) {
        const guest = room.guests.find(function (person) { return person.id === id; });
        if (guest) return { guest: guest, room: room };
      }
      return null;
    }
    function createGuest(guest) {
      const $card = $('<button>', { type: 'button', id: guest.id, class: 'guest color-' + guest.color, 'aria-label': guest.name + ', came at ' + guest.time + (isTask2 ? '. Open guest details' : '') })
        .attr({ 'data-name': guest.name, 'data-time': guest.time, 'data-arrival': minutes(guest.time), 'data-color': guest.color, 'data-aitu': String(guest.aitu), 'data-items': guest.items.join(' '), 'data-original-order': guest.originalOrder })
        .css('--clothing-color', colors[guest.color]);
      if (guest.aitu) $card.addClass('aitu');
      guest.items.forEach(function (item) { $card.addClass('has-' + item); });
      const $avatar = $('<span>', { class: 'avatar-wrap' }).append($('<img>', { src: '../shared/avatars/' + guest.id + '.svg', alt: '' }));
      if (guest.aitu) $avatar.append($('<span>', { class: 'aitu-badge', title: 'AITU student', text: 'A' }));
      const $items = $('<span>', { class: 'guest-items', 'aria-label': guest.items.length ? 'Has ' + guest.items.map(function (item) { return itemWords[item]; }).join(', ') : 'No belongings' });
      guest.items.forEach(function (item) {
        $items.append($('<span>', { class: 'item', title: itemWords[item], text: icons[item] }));
      });
      if (!guest.items.length) $items.append($('<span>', { class: 'nothing', text: '—', title: 'No belongings' }));
      return $card.append($avatar, $('<span>', { class: 'guest-name', text: guest.name }), $('<span>', { class: 'guest-time', text: guest.time }), $items);
    }

    function updateCounts() {
      $('.room').each(function () { $(this).find('.room-count').text($(this).find('.guest-list > .guest').length); });
    }

    function renderParty() {
      $('#house').empty();
      [2, 1].forEach(function (floor) {
        const $floor = $('<section>', { class: 'floor', 'data-floor': floor, 'aria-label': 'Floor ' + floor });
        const $rooms = $('<div>', { class: 'rooms' });
        $floor.append($('<h3>', { class: 'floor-heading', text: floor === 2 ? 'Floor 2 (upstairs)' : 'Floor 1 (downstairs)' }), $rooms);
        party.filter(function (room) { return room.floor === floor; }).forEach(function (room) {
          const $room = $('<section>', { class: 'room', id: room.id, 'data-room': room.id, 'data-name': room.name, 'aria-label': room.name });
          const $heading = $('<div>', { class: 'room-heading' }).append($('<h3>', { text: room.name }), $('<span>', { class: 'room-count', text: room.guests.length }));
          $heading.append($('<button>', { class: 'sort-btn', type: 'button', 'data-room': room.id, 'aria-pressed': String(!!sorted[room.id]), text: sorted[room.id] ? '↺ Picture order' : '↕ Sort by time' }));
          const $list = $('<div>', { class: 'guest-list', 'aria-label': room.name + ' guests, left to right' });
          room.guests.forEach(function (guest) { $list.append(createGuest(guest)); });
          $room.append($heading, $list).appendTo($rooms);
        });
        $('#house').append($floor);
      });
      updateCounts();
    }

    // Mutation cases operate on DOM first. Their callbacks synchronize the model.
    function syncFromDOM() {
      const knownGuests = {};
      party.forEach(function (room) { room.guests.forEach(function (guest) { knownGuests[guest.id] = guest; }); });
      party.forEach(function (room) {
        room.guests = $('#' + room.id + ' .guest-list > .guest').map(function () {
          return copy(knownGuests[this.id] || window.MirasGuest);
        }).get();
        const ids = room.guests.map(function (guest) { return guest.id; });
        // Preserve the saved picture order even if a mutation runs while sorted.
        pictureOrders[room.id] = pictureOrders[room.id].filter(function (id) { return ids.includes(id); });
        ids.forEach(function (id, index) {
          if (!pictureOrders[room.id].includes(id)) {
            const previous = pictureOrders[room.id].indexOf(ids[index - 1]);
            pictureOrders[room.id].splice(previous + 1, 0, id);
          }
        });
        if (sorted[room.id]) {
          sorted[room.id] = room.guests.every(function (guest, index) { return index === 0 || minutes(room.guests[index - 1].time) <= minutes(guest.time); });
        }
        $('#' + room.id + ' .sort-btn').text(sorted[room.id] ? '↺ Picture order' : '↕ Sort by time').attr('aria-pressed', String(!!sorted[room.id]));
      });
      updateCounts();
    }

    function avatarRectangle(id) {
      const $avatar = $('#' + id + ' .avatar-wrap');
      if (!$avatar.length) return { left: $(window).width() / 2, top: $(window).height() / 2, width: 48, height: 48 };
      const offset = $avatar.offset();
      return { left: offset.left - $(window).scrollLeft(), top: offset.top - $(window).scrollTop(), width: $avatar.outerWidth(), height: $avatar.outerHeight() };
    }

    function closeDetail(immediate, callback) {
      if (!detail) { if (callback) callback(); return; }
      const old = detail;
      detail = null;
      detailVersion++;
      old.$panel.stop(true, false);
      old.$panel.css('overflow-y', 'hidden');
      old.$backdrop.stop(true, false);
      function finish() {
        old.$panel.remove(); old.$backdrop.remove();
        if (!detail && $('#' + old.id).length) $('#' + old.id).trigger('focus');
        if (callback) callback();
      }
      if (immediate) { finish(); return; }
      old.$panel.find('.detail-content').stop(true, true).fadeTo(100, 0);
      old.$backdrop.fadeOut(200);
      old.$panel.animate($.extend({ opacity: 0 }, avatarRectangle(old.id)), 220, finish);
    }

    function openDetail(id) {
      if (!isTask2) return;
      if (finishLayout) finishLayout();
      const found = guestById(id);
      if (!found) return;
      if (detail && detail.id === id) return;
      if (detail) { closeDetail(false, function () { openDetail(id); }); return; }
      // Cancel any older closing panel before a newer click starts opening.
      $('#detail-layer').find('*').stop(true, false);
      $('#detail-layer').empty();
      const guest = found.guest;
      const version = ++detailVersion;
      const $backdrop = $('<div>', { class: 'detail-backdrop' }).appendTo('#detail-layer');
      const $panel = $('<section>', { class: 'guest-detail', role: 'dialog', 'aria-modal': 'true', 'aria-label': guest.name + ' details', tabindex: '-1' }).css($.extend({ opacity: 0.35 }, avatarRectangle(id))).appendTo('#detail-layer');
      const $content = $('<div>', { class: 'detail-content' });
      const $close = $('<button>', { class: 'detail-close', type: 'button', 'aria-label': 'Close guest details', text: '×' });
      $content.append($close, createGuest(guest).find('.avatar-wrap').clone(), $('<h2>', { text: guest.name }), $('<p>', { text: 'Room: ' + found.room.name }));
      $content.append($('<p>', { text: 'Came at ' + guest.time }), $('<p>', { text: guest.aitu ? 'AITU student' : 'Not an AITU student' }), $('<p>', { text: 'Wearing ' + guest.color }));
      const words = guest.items.map(function (item) { return itemWords[item]; });
      const possessions = words.length > 1 ? words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1] : words[0];
      $content.append($('<p>', { text: words.length ? 'Has ' + possessions : 'Came with no belongings' }), $('<h3>', { text: 'Send to another room' }));
      const $moves = $('<div>', { class: 'move-buttons' });
      party.filter(function (room) { return room.id !== found.room.id; }).forEach(function (room) {
        $moves.append($('<button>', { class: 'move-btn', type: 'button', 'data-guest': id, 'data-move-to': room.id, text: 'Move to the ' + room.name.toLowerCase() }));
      });
      $content.append($moves).css('opacity', 0).appendTo($panel);
      const width = Math.min(370, $(window).width() - 30);
      $panel.css({ width: width, height: 'auto' });
      const height = Math.min($panel.outerHeight(), $(window).height() - 30);
      $panel.css(avatarRectangle(id));
      detail = { id: id, $panel: $panel, $backdrop: $backdrop };
      $backdrop.fadeTo(220, 1);
      $panel.animate({ left: ($(window).width() - width) / 2, top: Math.max(15, ($(window).height() - height) / 2), width: width, height: height, opacity: 1 }, 280, function () {
        if (detail && version === detailVersion) { $panel.css('overflow-y', 'auto'); $content.fadeTo(120, 1); $close.trigger('focus'); }
      });
    }

    function settleScene() {
      closeDetail(true);
      $('#detail-layer').find('*').stop(true, false);
      $('#detail-layer').empty();
      if (finishLayout) finishLayout();
      if (finishMutation) {
        const finish = finishMutation;
        finishMutation = null;
        finish();
      }
      $('.guest').stop(true, true).css({ top: 0, visibility: 'visible' });
    }

    function removeHighlight() {
      $('.guest, .room').removeClass('is-found');
      $('.case-btn').removeClass('is-active').attr('aria-pressed', 'false');
    }

    function clear() {
      settleScene();
      removeHighlight();
      if (isTask2) $('.guest').stop(true, false).fadeTo(300, 1);
      $('#result-title').text('Results cleared');
      $('#result-count').text($('.guest').length + ' guests in the house');
      $('#result-names').text('Select a case to see the matching guests or rooms.');
      $('#case-chain').text('// Select a case to inspect its chain.');
      announce('Cleared. All guests are bright.');
    }

    function runCase(id) {
      const investigation = window.PartyCases.find(function (entry) { return entry.id === Number(id); });
      if (!investigation) return;
      settleScene();
      if (!isTask2) {
        party = copy(window.PartyData);
        pictureOrders = Object.fromEntries(party.map(function (room) { return [room.id, room.guests.map(function (guest) { return guest.id; })]; }));
      }
      // Rebuild before every case. Task 2 rebuilds from its current, moved model.
      renderParty();
      removeHighlight();
      if (id === 18 || id === 19) {
        finishMutation = function () {
          if (id === 19) $('#natasha').stop(true, false).remove();
          else $('#miras').stop(true, false).show().css({ opacity: 1, top: 0 });
          syncFromDOM();
        };
      }
      const $found = investigation.run({
        createGuest: function (guest) {
          // Repeating the arrival case reuses Miras instead of duplicating IDs.
          const $existing = $('#' + guest.id);
          return $existing.length ? $existing.detach() : createGuest(guest);
        },
        duration: 300, onMutation: function () { finishMutation = null; syncFromDOM(); }
      });
      const $guests = investigation.target === 'rooms' ? $found.find('.guest') : $found;
      $found.addClass('is-found');
      const names = $found.map(function () { return $(this).attr('data-name'); }).get();
      if (isTask2) {
        // Do not interrupt the fadeIn/fadeOut used by the two mutation cases.
        $('.guest').not($guests).stop(true, false).fadeTo(300, 0.2);
        if (id !== 18 && id !== 19) $guests.stop(true, false).fadeTo(300, 1);
      }
      if (id !== 18 && id !== 19) $guests.stop(true, true).animate({ top: -9 }, 140).animate({ top: 0 }, 160);
      // Miras jumps after fading in.
      if (id === 18) $guests.animate({ top: -9 }, 140).animate({ top: 0 }, 160);
      $('.case-btn[data-case="' + id + '"]').addClass('is-active').attr('aria-pressed', 'true');
      $('#result-title').text('Case ' + String(id).padStart(2, '0') + ' · ' + investigation.title);
      $('#result-count').text(names.length + ' ' + (investigation.target === 'rooms' ? (names.length === 1 ? 'room' : 'rooms') : (names.length === 1 ? 'guest' : 'guests')) + (id === 19 ? ' departed' : ' found'));
      $('#result-names').text(names.join(', ') || 'No matches in the current party.');
      $('#case-chain').text(investigation.chain);
      announce('Case ' + id + ': ' + names.join(', '));
      updateCounts();
    }

    function makeFlight($guest, position) {
      return $guest.clone().removeAttr('id').removeClass('guest is-found').addClass('flight-clone').attr('aria-hidden', 'true')
        .css({ position: 'fixed', left: position.left - $(window).scrollLeft(), top: position.top - $(window).scrollTop(), width: $guest.outerWidth(), height: $guest.outerHeight(), maxWidth: 'none', opacity: 1, visibility: 'visible', margin: 0 }).appendTo('body');
    }

    function moveGuest(id, targetId) {
      settleScene();
      const found = guestById(id);
      if (!found || found.room.id === targetId) return;
      const target = roomById(targetId);
      if (!target) return;
      const $guest = $('#' + id).stop(true, true).css({ opacity: 1, top: 0 });
      const $targetList = $('#' + targetId + ' .guest-list');
      const start = $guest.offset();
      const width = $guest.outerWidth();
      const height = $guest.outerHeight();
      const $flight = makeFlight($guest, start);
      const $oldSlot = $('<span>', { class: 'move-slot' }).css({ width: width, height: height, marginRight: 0 });
      const $newSlot = $('<span>', { class: 'move-slot' }).css({ width: width, height: height });
      $guest.replaceWith($oldSlot);
      $targetList.append($newSlot);
      const gap = parseFloat($targetList.css('gap')) || 0;
      $oldSlot.css({ width: 0, marginRight: -gap });
      // Measure where the actual card will fit after responsive flex layout.
      $newSlot.replaceWith($guest.css('visibility', 'hidden'));
      const destination = $guest.offset();
      const destinationWidth = $guest.outerWidth();
      $guest.replaceWith($newSlot);
      $oldSlot.css({ width: width, marginRight: 0 });
      $newSlot.css({ width: 0, marginRight: -gap });
      found.room.guests = found.room.guests.filter(function (guest) { return guest.id !== id; });
      target.guests.push(found.guest);
      pictureOrders[found.room.id] = pictureOrders[found.room.id].filter(function (guestId) { return guestId !== id; });
      pictureOrders[targetId].push(id);
      sorted[found.room.id] = false;
      sorted[targetId] = false;
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        finishLayout = null;
        $flight.stop(true, false).remove();
        $oldSlot.stop(true, false).remove();
        $newSlot.stop(true, false).replaceWith($guest.css({ visibility: 'visible', opacity: 1, top: 0 }));
        updateCounts();
        $('.sort-btn').filter('[data-room="' + found.room.id + '"], [data-room="' + targetId + '"]').text('↕ Sort by time').attr('aria-pressed', 'false');
        announce(found.guest.name + ' moved to the ' + target.name.toLowerCase() + '.');
      }
      finishLayout = finish;
      $oldSlot.animate({ width: 0, marginRight: -gap }, 550);
      $newSlot.animate({ width: destinationWidth, marginRight: 0 }, 550);
      $flight.animate({ left: destination.left - $(window).scrollLeft(), top: destination.top - $(window).scrollTop(), width: destinationWidth }, 600, finish);
    }

    function sortRoom(id) {
      settleScene();
      const room = roomById(id);
      if (!room) return;
      sorted[id] = !sorted[id];
      const $list = $('#' + id + ' .guest-list');
      const snapshots = {};
      $list.children('.guest').each(function () { snapshots[this.id] = { offset: $(this).offset(), $flight: makeFlight($(this), $(this).offset()).addClass('sort-flight') }; });
      room.guests.sort(function (a, b) {
        return (sorted[id] ? minutes(a.time) - minutes(b.time) : 0) || pictureOrders[id].indexOf(a.id) - pictureOrders[id].indexOf(b.id);
      });
      room.guests.forEach(function (guest) { $list.append($('#' + guest.id).css('visibility', 'hidden')); });
      let remaining = room.guests.length;
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        finishLayout = null;
        Object.values(snapshots).forEach(function (entry) { entry.$flight.stop(true, false).remove(); });
        $list.children('.guest').css({ visibility: 'visible', top: 0 });
        announce(room.name + (sorted[id] ? ' sorted by arrival time.' : ' restored to picture order.'));
      }
      finishLayout = finish;
      room.guests.forEach(function (guest) {
        const $card = $('#' + guest.id);
        const end = $card.offset();
        snapshots[guest.id].$flight.animate({ left: end.left - $(window).scrollLeft(), top: end.top - $(window).scrollTop(), width: $card.outerWidth() }, 500, function () { if (--remaining === 0) finish(); });
      });
      if (!remaining) finish();
      $('#' + id + ' .sort-btn').text(sorted[id] ? '↺ Picture order' : '↕ Sort by time').attr('aria-pressed', String(sorted[id]));
    }

    function reset() {
      settleScene();
      party = copy(window.PartyData);
      pictureOrders = Object.fromEntries(party.map(function (room) { return [room.id, room.guests.map(function (guest) { return guest.id; })]; }));
      sorted = {};
      renderParty();
      clear();
      $('#result-title').text('Case results');
      $('#result-count').text('Select one of the 20 cases.');
      $('#result-names').text('Matching guests or rooms will appear here.');
      announce('Original party restored.');
    }

    window.PartyCases.forEach(function (entry) {
      $('<button>', { type: 'button', class: 'case-btn', 'data-case': entry.id, 'aria-pressed': 'false', title: entry.title })
        .append($('<span>', { class: 'case-number', text: String(entry.id).padStart(2, '0') }), $('<span>', { class: 'case-title', text: entry.title })).appendTo('#case-list');
    });
    $('#case-list').on('click', '.case-btn', function () { runCase(Number($(this).attr('data-case'))); });
    $('#clear-btn').on('click', clear);
    $('#reset-btn').on('click', reset);
    if (isTask2) {
      $('#scene-hint').text('Click a guest to see details or move them. Use Sort by time to change the order.');
      $('#house').on('click', '.guest', function () { openDetail(this.id); });
      $('#house').on('click', '.sort-btn', function () { sortRoom($(this).attr('data-room')); });
      $('#detail-layer').on('click', '.detail-backdrop, .detail-close', function () { closeDetail(false); });
      $('#detail-layer').on('click', '.move-btn', function () { moveGuest($(this).attr('data-guest'), $(this).attr('data-move-to')); });
      $(document).on('click', function (event) {
        if (detail && !$(event.target).closest('.guest-detail, #house .guest').length) closeDetail(false);
      });
      $(document).on('keydown', function (event) {
        if (event.key === 'Escape') {
          // Closing panels also need cancellation when Escape interrupts a swap.
          if (!detail) { $('#detail-layer').find('*').stop(true, false); $('#detail-layer').empty(); detailVersion++; }
          closeDetail(false);
        }
        if (event.key === 'Tab' && detail) {
          const $buttons = detail.$panel.find('button');
          if (event.shiftKey && document.activeElement === $buttons.first()[0]) { event.preventDefault(); $buttons.last().trigger('focus'); }
          else if (!event.shiftKey && document.activeElement === $buttons.last()[0]) { event.preventDefault(); $buttons.first().trigger('focus'); }
        }
      });
      $(window).on('resize', function () { settleScene(); });
    }
    window.PartyApp = { getState: function () { return copy(party); }, runCase: runCase, clear: clear, reset: reset, finishAnimations: settleScene, isTask2: isTask2 };
    reset();
  });
}(jQuery));
