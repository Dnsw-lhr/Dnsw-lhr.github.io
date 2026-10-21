/*
  START HERE. This is the only file you need to edit to change the writing.
  Keep the quote marks and commas. Empty links simply do not appear.
  Add screenshots to /assets and set image: "./assets/your-image.jpg".
  Only publish details you are comfortable sharing publicly.
*/

export const profile = {
  displayName: "Dnsw",
  avatar: "./assets/stories/dnsw-avatar.png",
  avatarModel: "./assets/stories/dnsw-avatar.glb", // Converted from your Roblox Studio OBJ export; textures embedded.
  role: "Artist & game developer",
  headline: "Creativity is intelligence having fun.",
  introduction: "Haii! I’m Dnsw, an artist who also makes games in Roblox and Unity. I do 2D and 3D art, frame-by-frame animation, Live2D, game programming, and most kind of designs.",
  about: ["Haii! I’m Dnsw, an artist who also makes games in Roblox and Unity. I do 2D and 3D art, frame-by-frame animation, Live2D, game programming, and most kind of designs.", "I always work independently, taking ideas from what I believe in, then make them real with full effort. In team projects, I help set the clear direction and organize the work. I care about quality, how a game feels to play, and what players have to say about it.", "Of what most people know about me, I’m the former creator of Kivotos:TD! (K:TD!), a Roblox tower defense game that I built entirely by myself, with a few models contributed by others. It taught me how closely game development and community management connect."],
  location: "",
  // Replace the text below with your own story. Short, specific paragraphs work best.
  story: [
    "Making games till now has me thought that it's not just about passion. I’ve learned through from building my first silly horror game, to running a well-known Roblox project and its community, to working under a GameJam deadline, and to be working as a manager for a larger Unity game.",
    "Each project has made a better me. I’ve learned to have some respect for myself and not blindly follow what others say. I also learned to recognize where a game needs more depth, and make room for the strengths of other people. Setbacks have also taught me to look closely at what went wrong and carry those lessons into the next version.",
    "Whether I’m drawing, animating, programming, or planning with a team, I urge the effort in the details to show in the finished experience."
],
  // Add only links you want to make public. Example: { label: "GitHub", url: "https://github.com/yourname" }
  links: [{label:"Instagram / art",url:"https://www.instagram.com/di_ns.naja/"},{label:"YouTube channel",url:"https://www.youtube.com/@DnswLhr"},{label:"Roblox profile",url:"https://www.roblox.com/users/1258781480/profile"}],
};

export const featuredProjects = [
  {
    id: "slash-speed",
    title: "RE//SLASH",
    category: "Unity · First-person action game",
    status: "In development",
    summary:
      "A fast-paced ninja game built around movement, parrying, and creative combinations of weapons and objects.",
    image: "", // Add a real screenshot or visual from your project.
    imageAlt: "",
    goal: "Create combat where speed and positioning give players interesting choices.",
    why: "I wanted each move to connect to the next, so movement feels like part of combat rather than a way to travel between fights.",
    role: "Concept, game systems, level ideas, and visual direction. Edit this to reflect your exact contribution.",
    tools: ["Unity", "C#", "Blender"],
    challenge: "How can parrying work with both incoming attacks and objects in the environment?",
    approach:
      "Prototype the interaction, check its timing and feedback, then build encounters and spaces that give it a purpose. Replace this with what you actually implemented and tested.",
    learned: "Add a specific lesson from your latest playable version here.",
    links: [],
  },
  {
    id: "roblox-systems",
    title: "Movement & Combat Systems",
    category: "Roblox · Gameplay programming",
    status: "Prototype collection",
    summary:
      "Experiments with momentum movement, weapon interactions, and an enemy framework built without Humanoids.",
    image: "",
    imageAlt: "",
    goal: "Make fast movement and combat feel expressive and readable.",
    why: "I wanted the player's decisions about direction, speed, and timing to matter.",
    role: "Gameplay programming and iterative tuning. Edit this to reflect collaborators if applicable.",
    tools: ["Roblox Studio", "Luau", "Moon Animator 2"],
    challenge: "Balance dash, bunny hopping, friction, and air control without accidental speed spikes or loss of control.",
    approach:
      "Separate movement rules into configurable values, test edge cases, and revise how acceleration and limits interact.",
    learned: "Add the most useful thing you learned from testing with players here.",
    links: [],
  },
];

export const moreProjects = [
  {
    title: "Fishing Interaction",
    type: "Roblox · Interaction prototype",
    description:
      "A mouse-controlled reeling idea with a moving target and catch progress. Add the result and a short clip when ready.",
    image: "",
    imageAlt: "",
    link: "",
  },
  {
    title: "Level & Visual Concepts",
    type: "Creative direction · Level design",
    description:
      "Explorations of level pacing, enemy silhouettes, UI, and the visual identity of an action game.",
    image: "",
    imageAlt: "",
    link: "",
  },
];

export const skills = [
  { category: "Game development", items: ["Unity", "C#", "Roblox Studio", "Luau", "OOP", "Blender"] },
  { category: "Design & production", items: ["Live2D", "Frame by frame animation", "UX & UI concepts", "Ibispaint X", "FL Studio", "3D animation", "2D & 3D Art"] },
];

export const creativeNote =
  "The design work here explores how color, silhouettes, typography, and level spaces communicate the energy of a game. Replace this with the creative work you most want to show.";

export const contact = {
  heading: "Want to see what I’m building?",
  message: "Choose a public way for people to reach you, then add it below.",
  // Leave blank until you choose a contact method. Example: "mailto:hello@example.com"
  url: "",
  label: "Get in touch",
};

// Optional decorative artwork: use your own exported image, or leave blank.
export const artwork = { image: "", label: "ART & MOTION" };
export const editorial = { draft: true, notice: "Portfolio in progress — descriptions and contributions are being verified. Playable builds and visuals will be linked when available." };

// Current approved project writing. Edit descriptions and links here.
export const projectGroups = [
  {
    "title": "Games I Build",
    "description": "Games shaped by responsive action, visual detail, and lessons learned from players and teams.",
    "entries": [
      {
        "title": "RE//SLASH",
        "heading": "Move fast. Slash everything. Make your own way through every fight.",
        "description": "RE//SLASH is my biggest Unity project: a Singleplayer, Fast-Paced Hack-N-Slash game inspired by ULTRAKILL and developed by a team of four. Its design centers on combining different weapons, fast movement, and parrying to give players room to improvise in combat.\n\n**My role — Game manager, sole artist, and marketer.** I shape the design, make decisions, and assign work across the team while producing the game’s art. I create every piece of 2D art, including player animations and icons, as well as the Hell level’s enemy models and their 3D animations. I also manage the game’s marketing accounts and updates.\n\n**What I’m working toward.** I want the project to grow into a distinctive game that can stand alongside commercial releases. Right now the game has entered the final round of an international competition. \n\n**What I learned.** Doing your best is a starting point and.. not some stupid reason to stop improving. I use the project’s setbacks to examine our decisions, address mistakes even if some weren't from us, and move the game closer to the experience we want to archive. Of course we failed a lot, but we didn't stop.",
        "links": [
          {
            "label": "Explore RE//SLASH",
            "url": "https://phoomx.itch.io/reslash"
          }
        ]
      },
      {
        "title": "Kivotos:TD! (K:TD!)",
        "heading": "I did everything, alone. NOT even AI.",
        "description": "Kivotos:TD! is a passion-driven Roblox tower defense game based on 'Blue Archive' that has received more than 800,000 visits to the game. I’m its former creator: I built it entirely on my own, apart from a few contributed models, and later sold it to another development team for personal reasons. I’m no longer directly involved in its development.\n\n**My role — the creator, community manager and also a marketer.** I handled the game’s development along with running its Discord community, which grew more than 3,300 members at the time I was still in my role.\n\n**What I focused on.** I put particular care into animation, UI design, responsive interactions, and unexpectedly small details that would give the game its own character. Good feedback from players also helped me understand what people valued in the experience.\n\n**The challenge.** Alongside development, I had to address bugs, limited replayability, and the responsibilities of a growing community.\n\n**What I learned.** A live game asks for more than creative and technical skill. It also requires listening from real feedbacks, setting priorities, and taking care of my people. Although I’ve moved on from the project, I really value the experience and the decisions that helped me grow and never regret about it.\n\n**Why did I sell the game??** It's simple, because I truly disgust Blue archive so much that I couldn't continue, yet. I never regret all the effort works I've had done.\n\nBlue Archive source original characters are credited to Nexon Games. My contribution described here is Fanart, development, UI, animation, and community management; the original characters and few character arts ingame from Blue Archive are not presented as my original art.",
        "links": [
          {
            "label": "View Kivotos:TD! on Roblox",
            "url": "https://www.roblox.com/games/132903971646556/Kivotos-TD"
          }
        ]
      },
      {
        "title": "OVERHEATED",
        "heading": "Two people, one doesn't know what to do, other one does. Seventy-two hours. Fast-paced combat.",
        "description": "OVERHEATED is a fast-paced Roblox hack-and-slash game made by two people in 72 hours for HamsterHub GameJamX, a national game jam.\n\n**My role — Most of the game beyond the map.** I worked on game design, lighting, player and weapon programming, enemies, animations, and UI. My teammate contributed the scene model and map.\n\n**The challenge.** The deadline demanded a broad range of work in a short time. Our entry did not win a placing, but the experience showed me where individual effort needs stronger coordination and shared experience behind it.\n\n**What I learned.** Being able to do many things alone does not replace teamwork. A team’s experience, communication, and ability to support one another matter just as much as each person’s skills.",
        "links": [
          {
            "label": "Explore OVERHEATED",
            "url": "https://phoomx.itch.io/overheatedroblox"
          }
        ]
      },
      {
        "title": "The Experiments",
        "heading": "Two months to make my first impressive horror game.",
        "description": "The Experiments is a Roblox horror game I developed for a high school project in 2022. It was submitted as a three-person project, and I handled all of the game development over two months.\n\n**Why it matters to me.** It was the first horror game I made whose quality I felt proud of. Looking back, it marks a point where I could see how much my skills had improved.",
        "links": [
          {
            "label": "View The Experiments on Roblox",
            "url": "https://www.roblox.com/games/9722089687/The-Experiments"
          }
        ]
      }
    ]
  },
  {
    "title": "Art I Create",
    "description": "2D and 3D art, frame-by-frame animation, and Live2D. I care about them all.",
    "entries": [
      {
        "title": "Cassy Fan Animation",
        "heading": "My first Live2D animation for a Roblox game.",
        "description": "I made a Cassy fan animation for a well-known Roblox game. Developers, a manager, and the character’s creator responded enthusiastically and I was sooooo happyy!!",
        "links": [
          {
            "label": "Watch the Cassy animation",
            "url": "https://youtu.be/T2NLgtRGmYU"
          }
        ]
      },
      {
        "title": "Drawings & Communities",
        "heading": "I can draw more..",
        "description": "A collection of my drawings and the arts I share.",
        "links": [
          {
            "label": "Explore my art",
            "url": "https://www.instagram.com/di_ns.naja/"
          }
        ]
      }
    ]
  }
];
