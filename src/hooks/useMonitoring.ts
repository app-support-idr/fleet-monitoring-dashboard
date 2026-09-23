import { useEffect, useState } from 'react';
import type { Application, MonitoringCheck, Incident } from '@/types';
import {
  getApplications,
  getLatestCheck,
  getRecentChecks,
  getIncidents,
  getAvailability,
} from '@/services/monitoringService';

const REFRESH_INTERVAL = 30_000; // 30 secondes

export function useApplication() {
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const apps = await getApplications();

      if (!active) return;

      setApp(apps[0] ?? null);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return { app, loading };
}

export function useLatestCheck(applicationId: number | undefined) {
  const [check, setCheck] = useState<MonitoringCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;

    let active = true;

    const load = async () => {
      const latestCheck = await getLatestCheck(applicationId);

      if (!active) return;

      setCheck(latestCheck);
      setLoading(false);
    };

    load();

    const interval = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [applicationId]);

  return { check, loading };
}

export function useRecentChecks(
  applicationId: number | undefined,
  hours: number = 24
) {
  const [checks, setChecks] = useState<MonitoringCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;

    let active = true;

    const load = async () => {
      const recentChecks = await getRecentChecks(applicationId, hours);

      if (!active) return;

      setChecks(recentChecks);
      setLoading(false);
    };

    load();

    const interval = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [applicationId, hours]);

  return { checks, loading };
}

export function useIncidents(applicationId: number | undefined) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;

    let active = true;

    const load = async () => {
      const incidentData = await getIncidents(applicationId);

      if (!active) return;

      setIncidents(incidentData);
      setLoading(false);
    };

    load();

    const interval = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [applicationId]);

  return { incidents, loading };
}

export function useAvailability(
  applicationId: number | undefined,
  hours: number = 24
) {
  const [availability, setAvailability] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicationId) return;

    let active = true;

    const load = async () => {
      const availabilityData = await getAvailability(applicationId, hours);

      if (!active) return;

      setAvailability(availabilityData);
      setLoading(false);
    };

    load();

    const interval = window.setInterval(load, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [applicationId, hours]);

  return { availability, loading };
}