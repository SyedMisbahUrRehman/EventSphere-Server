import chalk from 'chalk';

export const logger = {
    info: (message) => {
        console.log(chalk.blue('ℹ INFO:'), message);
    },

    success: (message) => {
        console.log(chalk.green('✓ SUCCESS:'), message);
    },

    error: (message) => {
        console.log(chalk.red('✖ ERROR:'), message);
    },

    warning: (message) => {
        console.log(chalk.yellow('⚠ WARNING:'), message);
    },

    debug: (message) => {
        console.log(chalk.magenta('🔍 DEBUG:'), message);
    }
}; 