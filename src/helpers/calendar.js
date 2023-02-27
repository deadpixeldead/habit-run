import { capitalize, unique, sort } from './utils'
import { date } from 'quasar'
import moment from 'moment-timezone'

const WEEK_MASK = [
  {
    label: 'M'
  },
  {
    label: 'T'
  },
  {
    label: 'W'
  },
  {
    label: 'T'
  },
  {
    label: 'F'
  },
  {
    label: 'S'
  },
  {
    label: 'S'
  }
]

export const getWeeks = ({ duration, startDate, endDate }) => {
  const weekNumbers = []
  for (let i = 0; i < duration; i++) {
    let newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() + i)
    const weekNumber = {
      week: moment(newDate).isoWeek(),
      year: moment(newDate).year(),
      date: newDate
    }
    weekNumbers.unshift(weekNumber)
  }
  let actualWeeks = unique(weekNumbers, 'week').reverse()
  return actualWeeks.map((week, i) => {
    const mondayOfTheWeek = moment(week.year, 'YYYY')
      .isoWeekYear(week.year)
      .isoWeek(week.week - 1)
      .day(1)
      .toDate()
    return WEEK_MASK.map((day, index) => {
      let newDate = new Date(mondayOfTheWeek)
      newDate.setDate(newDate.getDate() + index)
      return {
        label: day.label,
        date: new Date(newDate.setHours(0, 0, 0, 0)),
        isInFuture: newDate > new Date(),
        isAfterHabitEnds: newDate > endDate,
        isBeforeHabitStart: newDate < startDate
      }
    })
  })
}

export const isChallengePast = challenge => {
  const startDate = new Date(challenge.startDate)
  const endDate = new Date(challenge.startDate)
  const today = new Date()
  const diffDays =
    Number(challenge.duration) === 0 ? 0 : Number(challenge.duration) - 1
  endDate.setDate(startDate.getDate() + diffDays)

  return endDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
}

export const isChallengeOlderThanAWeek = challenge => {
  const startDate = new Date(challenge.startDate)
  const endDate = new Date(challenge.startDate)
  const today = new Date()
  const diffDays =
    Number(challenge.duration) === 0 ? 0 : Number(challenge.duration) - 1
  endDate.setDate(startDate.getDate() + diffDays)
  endDate.setDate(endDate.getDate() + 7)
  return endDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
}

export const getReadableFrequency = (
  frequency,
  perWeek,
  perMonth,
  specificDays
) => {
  switch (frequency) {
    case 'daily':
      return 'Daily'
    case 'per-week':
      return `${perWeek}x / week`
    case 'per-month':
      return `${perMonth}x / month`
    default:
      return specificDays.map(capitalize).join(', ')
  }
}

export const getMonthWritten = month => {
  switch (month) {
    case 0:
      return 'Jan'
    case 1:
      return 'Feb'
    case 2:
      return 'Mar'
    case 3:
      return 'Apr'
    case 4:
      return 'May'
    case 5:
      return 'Jun'
    case 6:
      return 'Jul'
    case 7:
      return 'Aug'
    case 8:
      return 'Sep'
    case 9:
      return 'Okt'
    case 10:
      return 'Nov'
    case 11:
      return 'Dec'
  }
}

const isChallengeOngoing = endDate => {
  const today = new Date()
  return today <= endDate
}

const currentDuration = challenge => {
  const today = new Date()
  const unit = 'days'
  return date.getDateDiff(today, challenge.startDate, unit)
}

export const getScore = (challenge, completions, endDate) => {
  const isOngoing = isChallengeOngoing(endDate)
  let duration = isOngoing ? currentDuration(challenge) : challenge.duration
  if (challenge.frequency === 'daily') {
    return Math.round((100 * completions) / duration)
  }
  if (challenge.frequency === 'per-week') {
    const weeks = Number(duration) / 7
    const goal = weeks * Number(challenge.perWeek)
    return Math.round((100 * completions) / goal)
  }
  if (challenge.frequency === 'per-month') {
    const months = Number(duration) / 31
    const goal = months * Number(challenge.perMonth)
    return Math.round((100 * completions) / goal)
  }
  const weeks = Number(duration) / 7
  const goal = weeks * Number(challenge.specificDays.length)
  if (completions === 0) {
    return 0
  }
  return Math.round((100 * completions) / goal)
}

export const getBestStreak = (challenge, completions) => {
  const sortedCompletions = sort(completions, 'date', true)

  let streaks = []
  const previousIsStreak = (today, dayBefore) => {
    let yesterdayDate = new Date(today.date)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    return (
      dayBefore &&
      date.isSameDate(new Date(dayBefore.date), yesterdayDate, 'day')
    )
  }
  for (let i = 0; i < sortedCompletions.length; i++) {
    if (
      !completions[i - 1] ||
      !previousIsStreak(completions[i], completions[i - 1])
    ) {
      streaks.push(1)
    } else {
      const last = streaks[streaks.length - 1]
      streaks.push(parseInt(last, 10) + 1)
    }
  }
  if (!streaks.length) {
    return 0
  }

  return Math.max(...streaks)
}
