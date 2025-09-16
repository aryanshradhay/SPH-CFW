// src/hooks/useJobDataset.js
import { useEffect, useState } from 'react';
import { parseCsvToJobs } from '../utils/jobDataUtils';

export default function useJobDataset() {
  const [jobs, setJobs] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [skillIDF, setSkillIDF] = useState({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    parseCsvToJobs()
      .then(({ jobs: parsedJobs, divisions: parsedDivisions, skillIDF: idf }) => {
        if (!active) return;
        setJobs(parsedJobs);
        setDivisions(parsedDivisions);
        setSkillIDF(idf);
        setReady(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
      });

    return () => {
      active = false;
    };
  }, []);

  return { jobs, divisions, skillIDF, ready, error };
}

