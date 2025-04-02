// GameScene.js
export const defineStage2Scene = (k, setShowSudoku, BASE_WIDTH, BASE_HEIGHT,player) => {
    k.scene("stage2", (score) => {
      const WIDTH = BASE_WIDTH;
      const HEIGHT = BASE_HEIGHT;
      const WALL_THICKNESS = 8;
      player.paused=false
      // Add background
      k.add([k.sprite("map1"), k.scale(1), k.pos(0, 0), k.layer("bg")]);
      k.add(player)
      player.pos.x = WIDTH / 2;
      player.pos.y = HEIGHT / 2;
      player.play("idie")

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
        k.sprite("enemy2", { anim: "idle" }),
        k.scale(1.5),
        k.area({ scale: 1 }),
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
      ": Wow, you beat up Dr Triangle, you knock my shocks off!",
      ": ...",
      ": you are a cool dude……So here is the next question how many possible combinations of sudoku?",
      ": 6.670.903.752.021.072.936.960",
      ": Watch Out!",
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
      if (currentDialogue == ": Watch Out!") {
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