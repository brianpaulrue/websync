import { CloudFront } from 'aws-sdk'
import chalk, { Chalk } from 'chalk'

import { ItemDiff } from './types'

const ONE_MB = 1 << 20

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
  amount: number
}

export default class Stats implements StatsObject {
  public source: string
  public target: string
  public diffs: ItemDiff[] = []
  public distributions?: CloudFront.DistributionSummary[]
  public invalidations?: string[]
  public constitutesPayment: boolean = false
  public completed: boolean = false
  public invalidated: boolean = false
  public time: number = 0
  public amount: number = 0

  constructor(stats: Partial<StatsObject> = {}) {
    this.update(stats)
  }

  private diffToString(chalk: Chalk, diff: ItemDiff): string {
    const method = diff.type === 'DELETE' ? 'red' : diff.type === 'CREATE' ? 'green' : 'yellow'
    const symbol = diff.type === 'DELETE' ? '-' : '+'
    return chalk[method](`${symbol} ${diff.key}`)
  }

  private getDistributionName(dist: CloudFront.DistributionSummary): string {
    if (dist.Aliases.Items && dist.Aliases.Items.length)  {
      return dist.Aliases.Items[0]
    }
    return dist.DomainName
  }

  public update(stats: Partial<StatsObject>) {
    Object.assign(this, stats)
  }

  public toString({ colors = true }: { colors?: boolean } = {}): string {
    const c = new chalk.constructor({ enabled: colors })
    const diffToString = this.diffToString.bind(this, c)
    let ret = `${this.source} ${c.bold(c.greenBright(`\u2192`))} ${this.target}`

    if (!this.diffs.length) {
      ret += `\nUP TO DATE`
      return ret
    }

    ret += `\nTook: ${this.time / 1000} s`
    if (this.diffs.length) {
      const amount = (this.amount / ONE_MB).toFixed(2)
      ret += `\nTransferred (${amount} MB):\n\t${this.diffs.map(diffToString).join('\n\t')}\n`
    }

    const invalidations = (this.invalidations || []).map(p => c.red(p))
    if (this.invalidated && invalidations.length) {
      const domains = (this.distributions || []).map(d => c.blue(this.getDistributionName(d)))
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