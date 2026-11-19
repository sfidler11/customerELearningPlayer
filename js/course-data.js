/*
 * Course content for the player. Swap this file to build a different course.
 *
 * Each page has:
 *   title      Menu and eyebrow title
 *   duration   Narration length in seconds (the demo simulates audio with a timer)
 *   template   'title' | 'content' | 'accordion' | 'tabs' | 'slider' | 'iron' | 'rest' | 'bake' | 'completion'
 *   narration  Sentences shown in the captions panel
 * plus the fields its template needs (see README).
 */
window.COURSE_DATA = {
  title: 'Waffles 101',
  storageKey: 'waffles101-player',
  // Documents shared with the learner (the document icon in the header).
  // type: 'pdf' | 'pptx'. Put the files in the resources/ folder and set url to e.g. 'resources/guide.pdf'.
  // Leave url empty to show the row as "Coming soon".
  resources: [
    { title: 'Waffles job aid', type: 'pdf', url: 'resources/Waffles_Job_Aid.pdf', description: 'Classic Golden Waffles: ingredients and method' }
  ],
  modules: [
    {
      title: 'Getting started',
      pages: [
        {
          title: 'Welcome',
          duration: 18,
          template: 'title',
          eyebrow: 'Hello and welcome to...',
          lede: "In this short course you'll learn how to mix, cook, and serve crisp, golden waffles at home.",
          meta: '11 pages · 4 modules · no experience needed',
          image: 'images/plated-waffles.jpg',
          imageLabel: 'photo: plated waffles with strawberries and grapes on a red placemat',
          narration: [
            'Hello and welcome to Waffles 101.',
            "Over the next eleven pages you'll learn everything you need to make great waffles at home.",
            'Press Start the course when you are ready.'
          ]
        },
        {
          title: 'Your waffle toolkit',
          duration: 24,
          template: 'tabs',
          heading: 'You only need four tools',
          lede: 'Most kitchens already have everything except the waffle iron. Select a tool to see what it does. Select it again to close it.',
          items: [
            {
              name: 'Waffle iron',
              icon: '🧇',
              description: 'The one special tool. Two heated grids close around the batter and cook it from both sides at once. Round or square, any shape works.',
              tip: 'Pick one with a ready light.',
              image: 'images/waffle-iron.jpg',
              imageLabel: 'photo: a row of waffle irons with their grids open'
            },
            {
              name: 'Mixing bowls',
              icon: '🥣',
              description: 'You need two. Mix the dry ingredients in one and the wet ingredients in the other, then combine them.',
              tip: 'A large bowl for the batter helps you fold gently.',
              image: 'images/mixing-bowl.jpg',
              imagePosition: 'center 72%',
              imageLabel: 'photo: wooden spoon resting in a steel mixing bowl of batter'
            },
            {
              name: 'Whisk and spatula',
              icon: '🥄',
              description: 'Use the whisk to break up lumps in each bowl. Use a flexible spatula to fold the wet mix into the dry mix without overmixing.',
              tip: 'Stop folding as soon as the dry flour disappears.',
              image: 'images/whisk-spatula.jpg',
              imagePosition: 'center 22%',
              imageLabel: 'photo: a whisk, slotted spatula and spoons in a white jar'
            },
            {
              name: 'Ladle or measuring cup',
              icon: '🥛',
              description: 'A ladle or a measuring cup pours the same amount of batter every time, so your waffles cook evenly.',
              tip: 'About three-quarters of a cup fills most irons.',
              image: 'images/measuring-cup.jpg',
              imageLabel: 'photo: a glass measuring cup'
            }
          ],
          narration: [
            'Good news. You only need four tools to get started.',
            'The one special item is a waffle iron, and any shape works.',
            'Add two bowls, a whisk and spatula, and a ladle or measuring cup, and you are set.'
          ]
        },
        {
          title: 'How a waffle iron works',
          duration: 26,
          template: 'iron',
          heading: 'Hot plates, deep pockets',
          body: 'Two heated grids cook the batter from both sides at once.',
          points: ['The grid makes pockets that crisp up', 'Steam escapes from the sides as it cooks', 'Most irons have a ready light'],
          exploreLabel: 'Explore the waffle iron',
          modalTitle: 'Explore the waffle iron',
          // Parts: handle, top, bottom, light, switch. Each has a name and a short explanation.
          parts: {
            handle: { name: 'Handle', text: 'Lifts the lid and latches it shut. Always use the handle, because the metal around the plates gets very hot.' },
            top: { name: 'Top grid plate', text: 'Cooks the upper side of the waffle. Its raised squares press down into the batter to make the deep pockets and crisp edges.' },
            bottom: { name: 'Bottom grid plate', text: 'Holds the batter and browns the underside. Grease it lightly so the waffle lifts out cleanly.' },
            light: { name: 'Ready light', text: 'Tells you when the plates are hot enough. Pour the batter only after it turns green, so the outside crisps right away.',
              heating: 'The light is red while the iron heats up. When it turns green, the iron is ready for batter.' },
            switch: { name: 'Power switch', text: 'Turns the heat on and off. Switch it on first and let the iron preheat before you pour any batter.',
              tip: 'Try it: flip the switch on the iron and watch the plates heat up.' }
          },
          narration: [
            'A waffle iron is two heated grids that close around the batter.',
            'The grid shape creates deep pockets with lots of crisp edges.',
            'As the batter cooks, steam escapes. When the steam slows down, your waffle is nearly done.'
          ]
        }
      ]
    },
    {
      title: 'The batter',
      pages: [
        {
          title: 'Core ingredients',
          duration: 30,
          template: 'accordion',
          icons: [
            { icon: '🌾', label: 'Flour' },
            { src: 'images/baking-powder.svg', label: 'Baking powder' },
            { icon: '🥚', label: 'Eggs' },
            { icon: '🥛', label: 'Milk' },
            { icon: '🧈', label: 'Butter' }
          ],
          heading: 'Six ingredients do the work',
          lede: 'Open each ingredient to see what it does and how much you need.',
          items: [
            { name: 'Flour', description: 'Gives the waffle its structure. All-purpose flour works best.', amount: '2 cups' },
            { name: 'Baking powder', description: 'Makes the batter rise so the inside stays light and fluffy.', amount: '1 tablespoon' },
            { name: 'Eggs', description: 'Bind everything together and add richness.', amount: '2 large' },
            { name: 'Milk', description: 'Thins the batter so it spreads into every pocket.', amount: '1¾ cups' },
            { name: 'Melted butter', description: 'Adds flavor and helps the outside turn crisp.', amount: '½ cup' },
            { name: 'Sugar and salt', description: 'A little of each balances the flavor and helps browning.', amount: '2 tablespoons sugar, ½ teaspoon salt' }
          ],
          narration: [
            'Great waffles start with just six ingredients.',
            'Flour and baking powder give the waffle its shape and lift.',
            'Eggs, milk, and butter add richness and help the outside crisp.',
            'A little sugar and salt round out the flavor.'
          ]
        },
        {
          title: 'Mixing wet and dry',
          duration: 28,
          template: 'content',
          image: 'images/mixing-ingredients.jpg',
          imageLabel: 'photo: whisking wet and dry ingredients together in a steel bowl',
          imagePosition: 'center 55%',
          heading: 'Mix gently and stop early',
          body: 'A few lumps are fine. Overmixing makes waffles tough.',
          points: ['Whisk the dry ingredients in one bowl', 'Whisk the wet ingredients in the other', 'Pour wet into dry and fold until just combined'],
          narration: [
            'Mix your dry ingredients in one bowl and your wet ingredients in another.',
            'Pour the wet into the dry and fold gently with a spatula.',
            'Stop as soon as you no longer see dry flour. A few lumps are a good sign.'
          ]
        },
        {
          title: 'Resting the batter',
          duration: 20,
          template: 'rest',
          timerMinutes: 5,
          timerLabel: 'Click here to start a rest timer',
          heading: 'Give it five minutes',
          body: 'A short rest lets the flour absorb the liquid and the bubbles form.',
          points: ['Rest for 5 to 10 minutes', 'Heat the iron while you wait', "Don't stir again before cooking"],
          narration: [
            'Let the batter rest for five to ten minutes.',
            'This gives the flour time to absorb the milk and lets bubbles form.',
            'Use the time to heat up your waffle iron.'
          ]
        }
      ]
    },
    {
      title: 'Cooking',
      pages: [
        {
          title: 'Pouring the right amount',
          duration: 24,
          template: 'content',
          image: 'images/pouring-batter.jpg',
          imageLabel: 'photo: pouring batter from a funnel into the heated molds of a waffle iron',
          imagePosition: 'center 72%',
          heading: 'Pour into the center',
          body: 'The batter spreads as the lid closes, so start with less than you think.',
          points: ['Pour into the middle of the grid', 'Leave the edges about an inch clear', 'Close the lid right away'],
          narration: [
            'Pour the batter into the center of the iron.',
            'Leave about an inch clear around the edges, because it spreads as you close the lid.',
            'Close the lid right away and let it cook.'
          ]
        },
        {
          title: "Knowing when it's done",
          duration: 24,
          template: 'content',
          imageLabel: 'photo: golden waffle lifted out of the iron with a fork',
          heading: 'Watch the steam',
          body: 'When the steam slows to a wisp, the waffle is ready.',
          points: ['Most waffles take 3 to 5 minutes', 'Look for deep golden brown', 'Lift it out with a fork or tongs'],
          narration: [
            'Most waffles take three to five minutes.',
            'Watch the steam. When it slows down to a wisp, check the color.',
            'You want a deep golden brown. Lift it out gently with a fork.'
          ]
        }
      ]
    },
    {
      title: 'Serving',
      pages: [
        {
          title: "Keeping waffles warm until they're all ready",
          duration: 22,
          template: 'bake',
          heading: 'Keep them off the plate',
          body: 'Stacking traps steam and softens the crust. Hold finished waffles on a tray in a low oven while you cook the rest.',
          targetTemp: 200,
          waffleCount: 5,
          steps: ['Turn the oven on to 200\u00B0F', 'Move 5 waffles from the waffle iron to the tray', 'Slide the tray into the oven'],
          doneText: 'Nicely done! The waffles stay warm and crisp until you are ready to serve.',
          narration: [
            'Fresh waffles turn soft if you stack them.',
            'Set them on a wire rack in a low oven while you finish the batch.',
            'Stack them only when you are ready to serve.'
          ]
        },
        {
          title: 'Toppings and pairings',
          duration: 24,
          template: 'slider',
          heading: 'Sweet or savory',
          lede: 'Waffles go with almost anything. Select a section to slide it open and see how to serve it.',
          // color: 'amber' | 'berry' | 'green' | 'blue'
          items: [
            { kind: 'Sweet', color: 'amber', icon: '🍁', name: 'Butter and maple syrup',
              description: 'The classic. Melted butter sinks into every square while warm maple syrup pools in the pockets.',
              tip: 'A pinch of flaky salt on top' },
            { kind: 'Sweet', color: 'berry', icon: '🍓', name: 'Berries and whipped cream',
              description: 'Fresh, tart berries cut through soft whipped cream for a light, bright finish.',
              tip: 'Strawberries, blueberries or raspberries' },
            { kind: 'Savory', color: 'green', icon: '🍗', name: 'Fried chicken and hot honey',
              description: 'Crisp, salty chicken on a crisp waffle, finished with a sweet and spicy drizzle.',
              tip: 'A few pickled jalapeños' },
            { kind: 'Savory', color: 'blue', icon: '🍳', name: 'Egg, bacon and cheddar',
              description: 'A soft fried egg and crisp bacon on a waffle with sharp melted cheddar make a hearty breakfast.',
              tip: 'Fresh chives and black pepper' }
          ],
          narration: [
            'Waffles work with sweet and savory toppings.',
            'Go sweet with butter and maple syrup, or berries and whipped cream.',
            'Or go savory with fried chicken and hot honey, or egg, bacon and cheddar.'
          ]
        },
        {
          title: 'You did it',
          duration: 18,
          template: 'completion',
          heading: 'You did it! Course completed.',
          thanks: 'Thank you for taking Waffles 101. We hope you had fun, and that your next batch is your best yet.',
          pendingHeading: 'Almost there',
          pendingBody: 'Finish every page to complete the course.',
          narration: [
            'Congratulations. You have finished Waffles 101.',
            'Thank you for learning with us. We hope you enjoyed it.',
            'Now go make some waffles.'
          ]
        }
      ]
    }
  ]
};
