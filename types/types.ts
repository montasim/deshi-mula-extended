/**
 * Supported text casing styles.
 */
export type TCaseStyle = 'sentence' | 'title' | 'upper';

/**
 * Interface representing company details.
 */
export interface ICompanyContactInfo {
    website?: string;
    linkedin?: string;
    facebook?: string;
    github?: string;
    email?: string;
}

/**
 * The shape of our generic summary block.
 */
export interface ISummaryProps {
    title: string;
    subtitle: string;
    description: string;
    main: string;
    footer?: string;
}

export interface IAiSummaryResult {
    summary: string;
    sentiment: 'Positive' | 'Negative' | 'Mixed';
}

export interface IJobOpening {
    title: string;
    location?: string;
    link: string;
}

export interface ISalaryEntry {
    position: string;
    salaryRange: string;
}
