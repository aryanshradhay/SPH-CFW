

const DEFAULT_FEEDBACK_FORM_URL = 'https://forms.office.com/Pages/DesignPageV2.aspx?origin=NeoPortalPage&subpage=design&id=Wft223ejIEG8VFnerX05ych_mCxGzeNNvT6abMIWkX5UNzlMS1kyQkRMOVhOS1M1MlZSVkUySjFITy4u';
const DEFAULT_IMPROVEMENT_FORM_URL = 'https://forms.office.com/Pages/DesignPageV2.aspx?origin=NeoPortalPage&subpage=design&id=Wft223ejIEG8VFnerX05ych_mCxGzeNNvT6abMIWkX5UQzg0T1hTOEJDWThYNUc2WlFWTVVTQlJHNi4u';

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

