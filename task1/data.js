/* The order, clothing, arrival times, badges, and belongings are transcribed
 * from the house in Assignment 6.pdf. This file is intentionally plain data. */
(function () {
  'use strict';

  window.PartyData = [
    {
      id: 'balcony', name: 'Balcony', floor: 2,
      guests: [
        { id: 'aigerim', name: 'Aigerim', color: 'green', time: '20:45', aitu: true, items: ['cup', 'crumbs'] },
        { id: 'aliya', name: 'Aliya', color: 'black', time: '21:15', aitu: false, items: ['phone', 'cup'] },
        { id: 'madina', name: 'Madina', color: 'green', time: '22:10', aitu: false, items: ['phone', 'bag', 'crumbs'] },
        { id: 'ivan', name: 'Ivan', color: 'black', time: '20:10', aitu: true, items: ['cup'] }
      ]
    },
    {
      id: 'hall', name: 'Hall', floor: 2,
      guests: [
        { id: 'arman', name: 'Arman', color: 'yellow', time: '20:35', aitu: false, items: ['bag', 'glasses'] },
        { id: 'sophia', name: 'Sophia', color: 'purple', time: '21:20', aitu: true, items: ['phone'] },
        { id: 'dias', name: 'Dias', color: 'green', time: '19:45', aitu: true, items: [] },
        { id: 'bekzat', name: 'Bekzat', color: 'purple', time: '20:55', aitu: false, items: ['bag', 'cup', 'crumbs'] },
        { id: 'aruzhan', name: 'Aruzhan', color: 'blue', time: '21:50', aitu: true, items: ['phone'] },
        { id: 'saule', name: 'Saule', color: 'green', time: '21:25', aitu: false, items: ['glasses'] }
      ]
    },
    {
      id: 'kitchen', name: 'Kitchen', floor: 1,
      guests: [
        { id: 'nurlan', name: 'Nurlan', color: 'red', time: '19:40', aitu: true, items: ['phone', 'cup'] },
        { id: 'emma', name: 'Emma', color: 'black', time: '20:15', aitu: false, items: ['bag'] },
        { id: 'timur', name: 'Timur', color: 'green', time: '21:05', aitu: true, items: ['phone', 'bag', 'crumbs'] },
        { id: 'sergey', name: 'Sergey', color: 'yellow', time: '20:50', aitu: false, items: [] },
        { id: 'yerlan', name: 'Yerlan', color: 'red', time: '21:40', aitu: true, items: ['glasses', 'phone'] },
        { id: 'kamila', name: 'Kamila', color: 'green', time: '20:05', aitu: false, items: ['cup'] }
      ]
    },
    {
      id: 'living-room', name: 'Living room', floor: 1,
      guests: [
        { id: 'daniel', name: 'Daniel', color: 'blue', time: '19:55', aitu: true, items: ['glasses'] },
        { id: 'zarina', name: 'Zarina', color: 'green', time: '21:10', aitu: false, items: ['bag', 'phone', 'crumbs'] },
        { id: 'natasha', name: 'Natasha', color: 'yellow', time: '20:30', aitu: true, items: [] },
        { id: 'askar', name: 'Askar', color: 'black', time: '21:00', aitu: true, items: ['phone'] },
        { id: 'inkar', name: 'Inkar', color: 'purple', time: '20:20', aitu: false, items: ['bag'] }
      ]
    }
  ];

  // A stable position in the picture is retained when somebody changes rooms.
  let pictureOrder = 0;
  window.PartyData.forEach(function (room) {
    room.guests.forEach(function (guest) {
      guest.originalRoom = room.id;
      guest.originalOrder = pictureOrder++;
    });
  });

  window.MirasGuest = {
    id: 'miras', name: 'Miras', color: 'blue', time: '21:20',
    aitu: true, items: ['phone'], originalRoom: 'living-room', originalOrder: 19.5
  };
}());
