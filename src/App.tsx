import { useEffect, useState } from "react";

import styles from "./app.module.scss";
import cn from "classnames";

import toast, { Toaster } from "react-hot-toast";

import {
  usePrivy,
  type CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";

const createField = (size: number, countMines: number) => {
  const field: number[] = new Array(100).fill(0);

  const calcNear = (x: number, y: number) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      if (field[x * size + y] === -1) return;
      field[x * size + y] += 1;
    }
  };

  for (let i = 0; i < countMines; ) {
    let x: number = Math.floor(Math.random() * size);
    let y: number = Math.floor(Math.random() * size);
    let posMine: number = x * size + y;
    if (field[posMine] === -1) continue;
    field[posMine] = -1;
    i++;
    calcNear(x + 1, y);
    calcNear(x - 1, y);
    calcNear(x, y - 1);
    calcNear(x, y + 1);

    calcNear(x + 1, y + 1);
    calcNear(x - 1, y + 1);
    calcNear(x + 1, y - 1);
    calcNear(x - 1, y - 1);
  }
  return field;
};

function App() {
  const [score, setScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isStart, setIStart] = useState<boolean>(false);
  const [countMines, setCountMines] = useState<number>(15);

  const size: number = 10;
  const [field, setField] = useState<number[]>([]);

  const [mask, setMask] = useState<number[]>(new Array(100).fill(0));

  const checkWin = () => {
    const countChecked = mask.filter((value) => value === 1).length;

    if (countChecked == size ** 2 - countMines) {
      setScore(countMines * 10);
      toast.success("You won!!!!!!!!!!!!!!!!!!! your score: " + score);
      return true;
    }
    return false;
  };

  const startGame = async () => {
    if (countMines >= 40 || countMines < 15)
      return toast.error("mines range: 15 - 40");

    if (isStart) return;
    if (isGameOver) setIsGameOver(false);
    setMask(() => new Array(100).fill(0));
    setIStart(true);
    setField(createField(size, countMines));
  };

  const clickMine = (x: number, y: number) => {
    if (!isStart) return;
    if (mask[x * size + y] === 1 || mask[x * size + y] === 2) return;

    if (isGameOver) return;

    if (field[x * size + y] === -1) {
      setMask(() =>
        mask.map((value, n) => {
          if (field[n] === -1) return -1;

          return value;
        })
      );
      setIsGameOver(true);
      setTimeout(() => {
        return toast("You lost, loser(", { icon: "😭" });
      }, 100);
      setField([]);

      setIStart(false);
      return;
    }

    setMask(() =>
      mask.map((value, n) => {
        if (n === x * size + y) return 1;
        return value;
      })
    );

    const clearing: { x: number; y: number }[] = [];

    const clear = (x: number, y: number) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return;

      if (mask[x * size + y] === 1) return;

      clearing.push({ x: x, y: y });
    };

    clear(x, y);

    while (clearing.length) {
      const temp: { x: number; y: number } = clearing.pop();
      const x = temp.x;
      const y = temp.y;
      mask[x * size + y] = 1;
      if (field[x * size + y] !== 0) continue;

      clear(x + 1, y);
      clear(x - 1, y);
      clear(x, y - 1);
      clear(x, y + 1);

      clear(x + 1, y - 1);
      clear(x + 1, y + 1);
      clear(x - 1, y - 1);
      clear(x - 1, y + 1);

      setMask(() =>
        mask.map((value, n) => {
          if (n === x * size + y) return 1;
          return value;
        })
      );
    }
    if (checkWin()) {
      setTimeout(() => {
        return toast.success("You won!!!!!!!!!!!!!!!!!!!");
      }, 100);
      setIStart(false);
      setField([]);
      setMask(new Array(100).fill(0));
      return;
    }
  };

  const flagged = (e: any, x: number, y: number) => {
    e.preventDefault();
    if (!isStart) return;
    if (isGameOver) return;
    if (mask[x * size + y] === 1) return;

    setMask(() =>
      mask.map((value, n) => {
        if (n === x * size + y) {
          if (value === 2) {
            return 0;
          } else {
            return 2;
          }
        }
        return value;
      })
    );
  };

  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string | undefined>();
  const [username, setUsername] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>("");

  // Shorten address for UI
  const shortAddr = (addr?: string) =>
    addr && addr.startsWith("0x") && addr.length > 10
      ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
      : addr || "";
  const getUsername = async (addr?: string) => {
    try {
      const response = await fetch(
        `https://www.monadclip.fun/api/check-wallet?wallet=${addr}`
      );

      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const result = await response.json();

      setUsername(result?.user.username);
    } catch {
      console.error("error");
    }
  };
  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID
        const crossAppAccount: CrossAppAccountWithMetadata =
          user.linkedAccounts.filter(
            (account) =>
              account.type === "cross_app" &&
              account.providerApp.id === "cmd8euall0037le0my79qpz42"
          )[0] as CrossAppAccountWithMetadata;

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount.embeddedWallets.length > 0) {
          setAccountAddress(crossAppAccount.embeddedWallets[0].address);
          getUsername(crossAppAccount.embeddedWallets[0].address);
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    }
  }, [authenticated, user, ready]);

  return (
    <>
      <div className={styles.wrapper}>
        <Toaster
          position="top-left"
          containerStyle={{ position: "absolute" }}
          reverseOrder={false}
        />
        <div className={styles.connectBtn}>
          <button onClick={user ? logout : login}>
            {user ? "Logout" : "Login with Monad ID"}
          </button>
          <div>
            <p>Username: {username}</p>
            <span>Wallet: {shortAddr(accountAddress)}</span>
          </div>
        </div>
        <div className={styles.main}>
          <div className={styles.settings}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {/* <label>Bet</label>
                <input
                  disabled={isStart}
                  value={bet}
                  onChange={(e) => setBet(e.target.value)}
                  placeholder="amount mon"
                  type="number"
                /> */}
              <label>Mines</label>
              <input
                disabled={isStart}
                value={countMines}
                onChange={(e) => setCountMines(Number(e.target.value))}
                placeholder="count mines"
                type="number"
              />
              <div>
                mines range: 15 - 40 <br /> scoring: (count mines * 10)
              </div>
            </div>

            <button disabled={isStart || !user} onClick={startGame}>
              {!user ? "Connect Monad ID" : "Play"}
            </button>
          </div>
          <div className={styles.wrapBoard}>
            {[...Array(size)].map((_, y) => {
              return (
                <div key={y} className={styles.boardLine}>
                  {[...Array(size)].map((_, x) => {
                    return (
                      <div
                        onContextMenu={(e: any) => flagged(e, x, y)}
                        onClick={() => clickMine(x, y)}
                        key={x}
                        className={cn(
                          styles.tile,
                          {
                            [styles.tileChecked]: mask[x * size + y] === 1,
                          },
                          {
                            [styles.tileFlagged]: mask[x * size + y] === 2,
                          },
                          {
                            [styles.tileBomb]: mask[x * size + y] === -1,
                          }
                        )}
                      >
                        {mask[x * size + y] === 1
                          ? field[x * size + y] > 0
                            ? field[x * size + y]
                            : ""
                          : ""}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
