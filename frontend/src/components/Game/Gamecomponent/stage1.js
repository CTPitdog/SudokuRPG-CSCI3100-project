// GameScene.js
export const defineStage1Scene = (k, setShowSudoku, BASE_WIDTH, BASE_HEIGHT, player) => {
  k.scene("stage1", (score) => {
    const WIDTH = BASE_WIDTH;
    const HEIGHT = BASE_HEIGHT;
    const WALL_THICKNESS = 8;

    player.paused=false
    // Add background
    k.add([k.sprite("floor"), k.scale(1), k.pos(0, 0), k.layer("bg")]);
    k.add(player);
    player.pos.x = WIDTH / 2;
    player.pos.y = HEIGHT / 2;
    player.play("idie");

    let cat = k.add([k.sprite("cat"), 
      { anim: "sit1" }, 
      k.scale(1.5), 
      k.pos(0, 0), 
      k.layer("obj"),
      k.color(100, 200, 27),
      k.area({ scale: 0.5, offset: k.vec2(0, 10) }),
      k.body({ isStatic: true }),
      k.anchor("center"),
      "cat",
    ]);
    cat.pos.x = 20;
    cat.pos.y = HEIGHT /2+20;
    cat.play("sit1");

    // Add walls
    const walls = [
      [WIDTH, WALL_THICKNESS, 0, -WALL_THICKNESS],
      [WIDTH, WALL_THICKNESS, 0, HEIGHT],
      [WALL_THICKNESS, HEIGHT + WALL_THICKNESS * 2, -WALL_THICKNESS, -WALL_THICKNESS],
      [WALL_THICKNESS, HEIGHT + WALL_THICKNESS * 2, WIDTH, -WALL_THICKNESS],
    ];

    walls.forEach(([w, h, x, y]) => {
      k.add([
        k.rect(w, h),
        k.pos(x, y),
        k.area(),
        k.body({ isStatic: true }),
        k.color(0, 0, 0),
        "wall",
        k.layer("obj"),
      ]);
    });

    // Add score display
    k.add([k.text(score), k.pos(4, 4), k.scale(0.5), k.layer("ui")]);

    // Add enemy
    const enemy = k.add([
      k.sprite("enemy", { anim: "idle" }),
      k.scale(3),
      k.area({ scale: 0.8 }),
      k.pos(WIDTH / 2, 20),
      k.body({ isStatic: true }),
      k.anchor("center"),
      "enemy",
      k.layer("obj"),
    ]);

    // Flag to prevent multiple dialogs
    let dialogActive = false;

    // Get the dialog elements
    const dialogOverlay = document.getElementById("sudokuDialog");
    const dialogbox = document.getElementById("dialogbox");
    const yesButton = document.getElementById("yesButton");
    const noButton = document.getElementById("noButton");
    const gamecanvas = document.getElementById("gameCanvas");
    const dialogueList = [
      ': So, computer are you going to teach us sudoku? ',
      ": ……",
      ": You are so boring ,here is the first question. For the classical sudoku,how many numbers does a sudoku grid require in order to obtain unique solution?",
      ": 17 clues",
      ": Perfect! Face our sudoku and Loss, stranger!"
    ];

    // Function to show the dialog
    const showDialog = () => {
      if (dialogActive) return; // Prevent multiple dialogs
      dialogActive = true;

      // Show the HTML dialog
      dialogOverlay.style.display = "flex";

      player.paused = true
      // Pause the game (optional, depending on your game design)
      k.timeScale = 0; // Pauses Kaboom updates
      nextDialogue();
    };

    const nextDialogue = () => {
      const currentDialogue = dialogueList.shift();
      if (!currentDialogue) {
        return;
      }
      document.getElementById("dialogue").innerText = currentDialogue;
      if (currentDialogue === ": Perfect! Face our sudoku and Loss, stranger!") {
        yesButton.style.display = "block";
        noButton.style.display = "block";
      }
      else{
        yesButton.style.display = "none";
        noButton.style.display = "none";
      }
    };

    // Function to hide the dialog
    const hideDialog = () => {
      player.paused=false
      dialogOverlay.style.display = "none";
      dialogActive = false;
      k.timeScale = 1; // Resume game updates
      if (gamecanvas) gamecanvas.focus();
    };

    // Hide dialog when clicking outside the dialog box
    dialogOverlay.addEventListener("click", (event) => {
      if (event.target === dialogOverlay) {
      hideDialog();
      }
    });

    // Handle "Enter" key press to go to the next dialogue
    document.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && dialogActive) {
      nextDialogue();
      }
    });

    dialogbox.addEventListener("click", (event) => {
      nextDialogue();
    });



    // Handle "Yes" button click
    yesButton.addEventListener("click", () => {
      setShowSudoku(true); // Show Sudoku game
      hideDialog();
      player.paused=true
    });

    // Handle "No" button click
    noButton.addEventListener("click", () => {
      hideDialog();
    });

    // Trigger dialog on collision
    enemy.onCollide("player", () => {
      showDialog();
    });

    k.camPos(WIDTH / 2, HEIGHT / 2);
  });
};