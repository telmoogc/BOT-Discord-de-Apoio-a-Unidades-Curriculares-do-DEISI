function toDaysMinutesSeconds(totalSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const days = Math.floor(totalSeconds / (3600 * 24));
  
    const secondsStr = makeHumanReadable(seconds, 'segundo');
    const minutesStr = makeHumanReadable(minutes, 'minuto');
    const hoursStr = makeHumanReadable(hours, 'hora');
    const daysStr = makeHumanReadable(days, 'dia');
  
    return `${daysStr}${hoursStr}${minutesStr}${secondsStr}`.replace(/,\s*$/, '');
  }
  
  function makeHumanReadable(num, singular) {
    return num > 0
      ? num + (num === 1 ? ` ${singular}, ` : ` ${singular}s, `)
      : '';
  }

  module.exports = {
    toDaysMinutesSeconds: toDaysMinutesSeconds
}