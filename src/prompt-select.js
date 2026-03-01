/**
 * Arrow-key selection menu (no typing numbers). Uses setRawMode + keypress.
 * Options: [{ label: string, value: any }]. Returns the value of the selected option.
 */

import readline from 'readline';

const CLEAR_LINE = '\x1b[2K';
const CURSOR_UP = '\x1b[A';
const HIDE_CURSOR = '\x1b[?25l';
const SHOW_CURSOR = '\x1b[?25h';

/**
 * Show a select menu with arrow keys and Enter. No numbers to type.
 * @param {string} title - Line shown above the options
 * @param {{ label: string, value: any }[]} options - Options to choose from
 * @param {number} [defaultIndex=0] - Initially selected index
 * @returns {Promise<any>} - The value of the selected option
 */
export function selectWithArrows(title, options, defaultIndex = 0) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY || options.length === 0) {
      const i = Math.min(defaultIndex, options.length - 1);
      resolve(options[i]?.value);
      return;
    }

    let index = Math.min(defaultIndex, options.length - 1);
    const lines = options.length;

    function render() {
      const out = [];
      out.push('  ' + title);
      options.forEach((opt, i) => {
        out.push((i === index ? '  > ' : '    ') + opt.label);
      });
      return out.join('\n');
    }

    function redraw() {
      for (let i = 0; i < lines + 1; i++) {
        process.stdout.write(CURSOR_UP + CLEAR_LINE);
      }
      process.stdout.write(render());
    }

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdout.write(HIDE_CURSOR + render());

    const onKeypress = (str, key) => {
      if (key.name === 'up') {
        index = index <= 0 ? options.length - 1 : index - 1;
        redraw();
        return;
      }
      if (key.name === 'down') {
        index = index >= options.length - 1 ? 0 : index + 1;
        redraw();
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdout.write(SHOW_CURSOR + '\n\n');
        resolve(options[index].value);
        return;
      }
      if (key.sequence === '\u0003') {
        cleanup();
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdout.write(SHOW_CURSOR + '\n');
        process.exit(130);
      }
    };

    function cleanup() {
      process.stdin.removeListener('keypress', onKeypress);
      process.stdin.pause();
    }

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('keypress', onKeypress);
  });
}
