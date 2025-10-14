// src/utils/datasets.js

const PUBLIC_PREFIX = process.env.PUBLIC_URL || '';

export const POSITION_SKILLS_CSV_PATH = '/position-skills.csv';

export const getDatasetUrl = (path) => `${PUBLIC_PREFIX}${path}`;

export const POSITION_SKILLS_CSV_URL = getDatasetUrl(POSITION_SKILLS_CSV_PATH);

export const CSV_URL = POSITION_SKILLS_CSV_URL;
