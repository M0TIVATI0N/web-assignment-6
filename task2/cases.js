/* Every run() returns ONE jQuery chain. Selection reads the current DOM,
 * never PartyData. The small filter predicates read card attributes/siblings. */
(function($) {
  'use strict';

  function define(id, title, target, explanation, run) {
    // The displayed/report chain is derived from the executable function,
    // so the explanation panel cannot drift away from the actual code.
    const source = run.toString();
    return {
      id: id,
      title: title,
      target: target,
      explanation: explanation,
      run: run,
      chain: source.slice(source.indexOf('return ') + 7, source.lastIndexOf(';')).trim()
    };
  }

  window.PartyCases = [
    define(1, 'Who is in the hall?', 'guests',
      'Start at the hall room and find its guest cards.',
      function() {
        return $('#hall').find('.guest');
      }),
    define(2, 'Who is dressed in yellow or purple?', 'guests',
      'A comma combines the two clothing-color selectors.',
      function() {
        return $('.guest.color-yellow, .guest.color-purple');
      }),
    define(3, 'Which AITU students are upstairs?', 'guests',
      'Search only floor 2, then select cards with an AITU badge class.',
      function() {
        return $('.floor[data-floor="2"]').find('.guest.aitu');
      }),
    define(4, 'Who has glasses or a bag?', 'guests',
      'The combined selector finds either possession and removes duplicates.',
      function() {
        return $('.guest.has-glasses, .guest.has-bag');
      }),
    define(5, 'Who came with nothing at all?', 'guests',
      'Exclude all five possible belongings from the guest cards.',
      function() {
        return $('.guest').not('.has-phone, .has-glasses, .has-bag, .has-cup, .has-crumbs');
      }),
    define(6, 'Who has a phone but no bag?', 'guests',
      'Keep phone owners and exclude bag owners.',
      function() {
        return $('.guest.has-phone').not('.has-bag');
      }),
    define(7, 'Who arrived from 20:30 through 21:00?', 'guests',
      'Compare the DOM arrival attribute in minutes; both boundaries are included.',
      function() {
        return $('.guest').filter(function() {
          const arrival = Number($(this).attr('data-arrival'));
          return arrival >= 1230 && arrival <= 1260;
        });
      }),
    define(8, 'Who arrived after 21:00 and is not AITU?', 'guests',
      'First exclude AITU students, then keep arrivals strictly later than 21:00.',
      function() {
        return $('.guest').not('.aitu').filter(function() {
          return Number($(this).attr('data-arrival')) > 1260;
        });
      }),
    define(9, 'Who stands right next to Askar?', 'guests',
      'Combine Askar’s immediate previous and next siblings in the room.',
      function() {
        return $('#askar').prev('.guest').add($('#askar').next('.guest'));
      }),
    define(10, 'Who stands last in each room?', 'guests',
      'The last child of each guest list is that room’s final guest.',
      function() {
        return $('.guest-list > .guest:last-child');
      }),
    define(11, 'Who stands third in each room?', 'guests',
      'nth-child(3) uses the guest’s position inside its own room.',
      function() {
        return $('.guest-list > .guest:nth-child(3)');
      }),
    define(12, 'Who stands after Timur in his room?', 'guests',
      'nextAll reads all later guest siblings, without leaving Timur’s room.',
      function() {
        return $('#timur').nextAll('.guest');
      }),
    define(13, 'Who stands right before someone in black?', 'guests',
      'Find black clothing first, then take each immediate previous guest.',
      function() {
        return $('.guest.color-black').prev('.guest');
      }),
    define(14, 'In which room is Aruzhan?', 'rooms',
      'Walk upward from Aruzhan’s card to its closest room.',
      function() {
        return $('#aruzhan').closest('.room');
      }),
    define(15, 'Which rooms have fewer than six guests?', 'rooms',
      'Count the current DOM cards inside each room, including any moves.',
      function() {
        return $('.room').filter(function() {
          return $(this).find('.guest').length < 6;
        });
      }),
    define(16, 'Which rooms have a cup but no glasses?', 'rooms',
      'has() requires a cup owner; not(:has()) excludes every room with glasses.',
      function() {
        return $('.room:has(.guest.has-cup):not(:has(.guest.has-glasses))');
      }),
    define(17, 'Who arrived first in each room?', 'guests',
      'A guest is earliest when no guest sibling has a smaller arrival value.',
      function() {
        return $('.guest').filter(function() {
          const arrival = Number($(this).attr('data-arrival'));
          return $(this).siblings('.guest').filter(function() {
            return Number($(this).attr('data-arrival')) < arrival;
          }).length === 0;
        });
      }),
    define(18, 'Miras joins between Askar and Inkar', 'guests',
      'Create Miras’s card, insert it directly after Askar, then fade it in.',
      function(context) {
        return context.createGuest(window.MirasGuest).hide().insertAfter($('#askar')).fadeIn(context
          .duration || 300,
          function() {
            if (context.onMutation) context.onMutation();
          });
      }),
    define(19, 'Natasha says goodbye and goes home', 'guests',
      'Fade Natasha out and remove the card only when the fade finishes.',
      function(context) {
        return $('#natasha').animate({
          top: -9
        }, 140).animate({
          top: 0
        }, 160).fadeOut(context.duration || 300, function() {
          $(this).remove();
          if (context.onMutation) context.onMutation();
        });
      }),
    define(20, 'Who took the birthday cake?', 'guests',
      'Downstairs, arrival strictly between 21:00 and 21:30, crumbs, no cup, and an adjacent AITU student.',
      function() {
        return $('.floor[data-floor="1"] .guest.has-crumbs:not(.has-cup)').filter(function() {
          const arrival = Number($(this).attr('data-arrival'));
          return arrival > 1260 && arrival < 1290 && $(this).prev('.guest.aitu').add($(this).next(
            '.guest.aitu')).length > 0;
        });
      })
  ];
}(jQuery));
