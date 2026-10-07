/*
 * Course content for the player. Swap this file to build a different course.
 *
 * Each page has:
 *   title      Menu and eyebrow title
 *   duration   Narration length in seconds (the demo simulates audio with a timer)
 *   template   'title' | 'content' | 'accordion'
 *   narration  Sentences shown in the captions panel
 * plus the fields its template needs (see README).
 */
window.COURSE_DATA = {
  title: 'Waffles 101',
  storageKey: 'waffles101-player',
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
          meta: '12 pages · 4 modules · no experience needed',
          image: '',
          imageLabel: 'photo: stack of golden waffles with butter and syrup',
          narration: [
            'Hello and welcome to Waffles 101.',
            "Over the next twelve pages you'll learn everything you need to make great waffles at home.",
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
              description: 'The one special tool. Two heated grids close around the batter and cook it from both sides at once. Round or square, any shape works.',
              tip: 'Pick one with a ready light.',
              imageLabel: 'photo: waffle iron open on the counter'
            },
            {
              name: 'Mixing bowls',
              description: 'You need two. Mix the dry ingredients in one and the wet ingredients in the other, then combine them.',
              tip: 'A large bowl for the batter helps you fold gently.',
              imageLabel: 'photo: two mixing bowls, one with flour and one with eggs and milk'
            },
            {
              name: 'Whisk and spatula',
              description: 'Use the whisk to break up lumps in each bowl. Use a flexible spatula to fold the wet mix into the dry mix without overmixing.',
              tip: 'Stop folding as soon as the dry flour disappears.',
              imageLabel: 'photo: whisk and spatula resting on a bowl'
            },
            {
              name: 'Ladle or measuring cup',
              description: 'A ladle or a measuring cup pours the same amount of batter every time, so your waffles cook evenly.',
              tip: 'About three-quarters of a cup fills most irons.',
              imageLabel: 'photo: ladle pouring batter into a measuring cup'
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
          template: 'content',
          imageLabel: 'diagram: open waffle iron showing heated grid plates',
          heading: 'Hot plates, deep pockets',
          body: 'Two heated grids cook the batter from both sides at once.',
          points: ['The grid makes pockets that crisp up', 'Steam escapes from the sides as it cooks', 'Most irons have a ready light'],
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
          imageLabel: 'photo: flour, eggs, milk, butter and baking powder',
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
          imageLabel: 'photo: spatula folding wet into dry batter',
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
          template: 'content',
          imageLabel: 'photo: covered bowl of batter resting on the counter',
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
          title: 'Heating and greasing',
          duration: 22,
          template: 'content',
          imageLabel: 'photo: brushing oil onto a hot waffle iron',
          heading: 'Start with a hot iron',
          body: 'A fully heated iron sets the outside fast so the waffle crisps.',
          points: ['Wait for the ready light', 'Brush or spray a thin layer of oil', 'Re-grease every two or three waffles'],
          narration: [
            'Always start with a fully heated iron.',
            'Brush on a thin layer of oil so the waffle releases cleanly.',
            'Add a little more oil every few waffles.'
          ]
        },
        {
          title: 'Pouring the right amount',
          duration: 24,
          template: 'content',
          imageLabel: 'photo: ladle pouring batter into the center of the iron',
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
          title: 'Keeping waffles crisp',
          duration: 22,
          template: 'content',
          imageLabel: 'photo: waffles on a wire rack in a low oven',
          heading: 'Keep them off the plate',
          body: 'Stacking traps steam and softens the crust.',
          points: ['Set waffles on a wire rack', 'Hold them in a 200°F oven', "Don't stack until you serve"],
          narration: [
            'Fresh waffles turn soft if you stack them.',
            'Set them on a wire rack in a low oven while you finish the batch.',
            'Stack them only when you are ready to serve.'
          ]
        },
        {
          title: 'Toppings and pairings',
          duration: 24,
          template: 'content',
          imageLabel: 'photo: waffles topped with berries, cream and syrup',
          heading: 'Sweet or savory',
          body: 'Waffles go with almost anything. Start simple and build from there.',
          points: ['Butter and maple syrup', 'Fresh berries and whipped cream', 'Fried chicken and hot honey'],
          narration: [
            'Waffles work with sweet and savory toppings.',
            'Butter and maple syrup are the classic choice.',
            'Try berries and cream, or go savory with fried chicken and hot honey.'
          ]
        },
        {
          title: 'You did it',
          duration: 18,
          template: 'content',
          imageLabel: 'photo: friends sharing a plate of waffles',
          heading: "You're ready to make waffles",
          body: "You've learned the tools, the batter, the cooking, and the serving.",
          points: ['Mix gently and let it rest', 'Cook in a hot, greased iron', 'Keep waffles crisp on a rack'],
          narration: [
            'Congratulations. You have finished Waffles 101.',
            'Remember to mix gently, cook in a hot iron, and keep your waffles crisp.',
            'Now go make some waffles.'
          ]
        }
      ]
    }
  ]
};
