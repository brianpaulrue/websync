import { CloudFront } from 'aws-sdk'
import chalk, { Chalk } from 'chalk'

import { ItemDiff } from './types'

export interface StatsObject {
  source: string
  target: string
  diffs: ItemDiff[]
  distributions?: CloudFront.DistributionSummary[]
  invalidations?: string[]
  constitutesPayment: boolean
  completed: boolean
  invalidated: boolean
  time: number
}

export default class Stats implements StatsObject {
  public source: string
  public target: string
  public diffs: ItemDiff[]
  public distributions?: CloudFront.DistributionSummary[]
  public invalidations?: string[]
  public constitutesPayment: boolean
  public completed: boolean
  public invalidated: boolean
  public time: number

  constructor(stats: Partial<StatsObject> = {}) {
    this.update(stats)
  }

  private diffToString(chalk: Chalk, diff: ItemDiff): string {
    const method = diff.type === 'DELETE' ? 'red' : diff.type === 'CREATE' ? 'green' : 'yellow'
    const symbol = diff.type === 'DELETE' ? '-' : '+'
    return chalk[method](`${symbol} ${diff.key}`)
  }

  public update(stats: Partial<StatsObject>) {
    Object.assign(this, stats)
  }

  public toString({ colors = true }: { colors?: boolean } = {}): string {
    const c = new chalk.constructor({ enabled: colors })
    const diffToString = this.diffToString.bind(this, c)
    let ret = `${this.source} ${c.bold(c.greenBright(`\u2192`))} ${this.target}`
    const invalidations = (this.invalidations || []).map(p => c.red(p))
    ret += `\nTook: ${this.time / 1000} s`
    ret += `\nTransfer:\n\t${this.diffs.map(diffToString).join('\n\t')}\n`
    if (this.invalidated) {
      const domains = (this.distributions || []).map(d => c.blue(d.DomainName))
      ret += `Invalidated on (${domains.join(', ')}):\n\t${invalidations.join('\n\t')}`
    }
    return ret
  }

  public clone(): Stats {
    return new Stats({
      source: this.source,
      target: this.target,
      diffs: this.diffs,
      distributions: this.distributions,
      invalidations: this.invalidations,
      constitutesPayment: this.constitutesPayment,
      completed: this.completed,
      invalidated: this.invalidated,
      time: this.time,
    })
  }
}