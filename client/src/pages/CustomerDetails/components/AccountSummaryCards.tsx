import { peso } from '../../../utils/format';

interface AccountSummary {
  totalCredits: number;
  totalBalance: number;
  totalPaid: number;
  activeCredits: number;
  overdueCredits: number;
}

interface Props {
  accountSummary: AccountSummary;
}

export default function AccountSummaryCards({ accountSummary }: Props) {
  return (
    <div className="grid grid-cols-4 gap-[18px] mb-8 max-[1100px]:grid-cols-2 max-[760px]:grid-cols-1">
      {/* Total Balance */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-5">
        <span className="text-[var(--color-text-muted)] text-sm font-bold">Total Balance</span>
        <strong className="text-[28px] font-bold block my-1.5 text-[var(--color-error)]">
          {peso(accountSummary.totalBalance)}
        </strong>
      </div>

      {/* Total Paid */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-5">
        <span className="text-[var(--color-text-muted)] text-sm font-bold">Total Paid</span>
        <strong className="text-[28px] font-bold block my-1.5 text-[var(--color-primary)]">
          {peso(accountSummary.totalPaid)}
        </strong>
      </div>

      {/* Total Credits */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-5">
        <span className="text-[var(--color-text-muted)] text-sm font-bold">Total Credits</span>
        <strong className="text-[28px] font-bold block my-1.5 text-[var(--color-primary)]">
          {peso(accountSummary.totalCredits)}
        </strong>
      </div>

      {/* Active Credits */}
      <div className="bg-white border border-[var(--color-border)] rounded-[var(--card-radius)] p-5">
        <span className="text-[var(--color-text-muted)] text-sm font-bold">Active Credits</span>
        <strong
          className={`text-[28px] font-bold block my-1.5 ${
            accountSummary.overdueCredits > 0
              ? 'text-[var(--color-error)]'
              : 'text-[var(--color-text-dark)]'
          }`}
        >
          {accountSummary.activeCredits}
        </strong>
        <small className="text-[var(--color-text-light)] text-xs">
          {accountSummary.overdueCredits} overdue
        </small>
      </div>
    </div>
  );
}