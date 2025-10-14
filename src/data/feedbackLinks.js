

const DEFAULT_FEEDBACK_FORM_URL = 'https://forms.office.com/e/sphcareerframeworkfeedback';
const DEFAULT_IMPROVEMENT_FORM_URL = 'https://forms.office.com/e/sphcareerframeworkimprovement';

const {
  REACT_APP_FEEDBACK_FORM_URL,
  REACT_APP_IMPROVEMENT_FORM_URL,
} = process.env;

export const FEEDBACK_LINKS = Object.freeze({
  feedback: REACT_APP_FEEDBACK_FORM_URL || DEFAULT_FEEDBACK_FORM_URL,
  improvement:
    REACT_APP_IMPROVEMENT_FORM_URL ||
    REACT_APP_FEEDBACK_FORM_URL ||
    DEFAULT_IMPROVEMENT_FORM_URL,
});

export const FEEDBACK_FORM_URL = FEEDBACK_LINKS.feedback;
export const IMPROVEMENT_FORM_URL = FEEDBACK_LINKS.improvement;

