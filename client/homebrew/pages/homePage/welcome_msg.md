# AGE Homebrewery
Warm your bones near the fire, adventurer, and regale us with your stories. Entice us with images of the wondrous artifacts you have found, their mysteries sheltered in some ancient tomb. Spins us a yarn of the distand lands and their people, the vexing vocations of which we have heard no tale. Put the fear of the gods in us with your deeds against demons and monsters of terror crawled forth from the pits of the underworld.

### Homebrew D&D made easy
The AGE Homebrewery makes the creation and sharing of authentic looking Adventure Game Engine homebrews easy. It uses a somewhat modified version of [Markdown](https://help.github.com/articles/markdown-basics/) in hand with a bit of CSS arcana to make your brews come to life.

**Try it! **Simply edit the text on the left and watch it *update live* on the right.

### Editing and Sharing
When you create your own homebrew on this site you will be provided with both an *edit url* and a *share url*. If you are online your changes will be saved automatically to the database within a few seconds. Anyone using the *share url* will be able to access a read-only version of your homebrew.

##### Fair warning
> For the time being, until the authentication system is fully online, anyone rogue or scallywag with the *edit url* will be able to make changes and set traps upon your homebrew. Trust only those you would trust with the location of your treasure horde!

## Helping out
Like this tool? Want to buy me some sweets or help with the servers? [Head over to my Patreon page](https://www.patreon.com/LimpingNinja) to help me keep the radiator filled with beer. This is purely voluntary as this tool will **always** be free, never have ads, and I will never offer any "premium" features or whatever.

### Why do this?
I've been an active DM for some time, then I found AGE. I absolutely adore the system but I found it difficult to create for and difficult to pull new players in. Impressed by the tools in the D&D community, especailly The Homebrewery, I felt a desire to help build our community in a similar manner. 

Releasing AGE Homebrewery is the first step in providing a set of DM tools to make your life easier and make the AGE ecosystem more fun to play. By providing even a small donation of $1 you are helping contribute to keeping the system running for the enjoyment of all and also to contribute to the future tools created!

```
```

### Our Roots
AGE Homebrewery is modified from the original **D&D Homebrewery by Scott Tolksdorf**. The largest portion of the changes, seen in the Changelog below, revolve around modifications to enable AGE rule styling and AGE specific content submissions. You can help him in his endeavors by going to [his Patreon site](https://www.patreon.com/stolksdorf).

## New Things Always
What's new in the latest update? Check out the full changelog [here](/changelog)

### Bugs, Issues, Suggestions?
Have an idea of how to make The Homebrewery better? Or did you find something that wasn't quite right? Head [here](https://github.com/LimpingNinja/age-homebrewery/issues) and let me know!.

### Legal Junk
AGE Homebrewery is licensed using the [MIT License](https://github.com/LimpingNinja/age-homebrewery/blob/master/license). Which means you are free to use AGE Homebrewery is any way that you want, except for claiming that you made it yourself. Just like we acknowledge our roots, you should too!

If you wish to sell or in some way gain profit for the content that you create on this site, it's your responsibility to ensure you have the proper licenses/rights for any images or resources used and the rights to distribute for the game engine you are building fore.

##### AGE System - Green Ronin
- The AGE system, or Adventure Game Engine for long, was originally designed for Dragon Age RPG and now is core to a handful of gaming systems. If you learn any of these systems  like Fantasy AGE, then you can easily pick up Dragon Age/Modern Age/Blue Rose/etc. The games are not identical but they share the same DNA. <br><br>
- AGE Untold and AGE Homebrewery have no affiliation with Green Ronin and do not imply that this site has any compatibility or legal rights to any Green Ronin resources. This site is intended to be a community location for generating open, non-infringing content for our favorite roleplaying games and nothing more. 

### More Resources
If you want to chat about AGEUntold and other AGE enthusiasts then please check out the newly created [r/AGEUntold](https://www.reddit.com/r/AGEUntold) or or [r/FantasyAge](https://www.reddit.com/r/FantasyAge).

Since Homebrewery has been around some time, there is already a plethora of resources on advanced use cases. These all generally apply to 5E and not AGE, but will give you some create ideas. Check out [r/UnearthedArcana](https://www.reddit.com/r/UnearthedArcana/) and their list of useful resources [here](https://www.reddit.com/r/UnearthedArcana/comments/3uwxx9/resources_open_to_the_community/).


<div class='pageNumber auto'></div>
<div class='footnote'>PART 1 | FANCINESS</div>

\page

# Appendix

## All the Errata

This page is intended as an introduction page and while there may be a few examples that you could cull here, it isn't inclusive of all the functionality nor does it describe it. You can visit the helpful [AGEd Brew Style Guide](https://brewery.ageuntold.com/StyleGuide). The following is a quick overview to get you started.

### Not quite Markdown
Although the Homebrewery uses Markdown, to get all the styling features from the Player HandBook, we had to get a little creative. Some base HTML elements are not used as expected and I've had to include a few new keywords.

___
* **Horizontal Rules** are generally used to *modify* existing elements into a different style. For example, a horizontal rule before a blockquote will give it the style of a Monster Stat Block instead of a note.
* **New Pages** are controlled by the author. It's impossible for the site to detect when the end of a page is reached, so indicate you'd like to start a new page, use the new page snippet to get the syntax.
* **Code Blocks** are used only to indicate column breaks. Since they don't allow for styling within them, they weren't that useful to use.
* **HTML** can be used to get *just* the right look for your homebrew. I've included some examples in the snippet icons above the editor.

### Images
Images can be included 'inline' with the text using Markdown-style images. However, for the background images more control is needed and you can include them with HTML-style img tags. Using inline css you can precisely position your image where you'd like it to be. This document has a background image snippet and an inflow image snippet to give you examples of how to do it.

>##### Image Hosting
> While I would love to host all the images for the 
> incredible people using this site, I simply do not have
> the kind of money that would take. Apologies!
> <br><br>
> Please use a site like [IMGUR](https://www.imgur.com) to host your images
> and to keep them fresh.

### Snippets
There are many different types of snippets available in the AGE Homebrewery, feel free to play with them and look at the markdown to understand how they work. On the next version I will include a completed Markdown that demonstrates the usage of the different styles within! 

```
```

>##### PDF Exporting
> PDF Printing works best in Chrome. If you are having quality/consistency issues, try using Chrome to print instead.
>
> After clicking the "Print" item in the navbar a new page will open and a print dialog will pop-up.
> * Set the **Destination** to "Save as PDF"
> * Set **Paper Size** to "Letter"
> * If you are printing on A4 paper, make sure to have the "A4 page size snippet" in your brew
> * In **Options** make sure "Background Images" is selected.
> * Hit print and enjoy! You're done!
>
> If you want to save ink or have a monochrome printer, add the **Ink Friendly** snippet to your brew before you print
## Last Details
If you'd like to credit AGE Homebrewery in your brew, go for it. A suggested blurb would be:

- Crafted with AGE Homebrewery (https://brewery.ageuntold.com) 

Of course this isn't asked for nor expected, so give credit to me, the original creator, Green Ronin, egg salad, your mother, or whomever you desire.

<img src='https://i.imgur.com/hMna6G0.png' style='position:absolute;bottom:1-0px;right:60px;width:320px' />
<img src='https://i.imgur.com/A7GPlnG.png' style='position:absolute;bottom:100px;right:205px;width:105px' />

<div class='pageNumber'>2</div>
<div class='footnote'>PART 2 | BORING STUFF</div>
