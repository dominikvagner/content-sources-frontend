import axios from 'axios';

export interface RoadmapLifecycleResponse {
  data: Array<LifecycleItem>;
}

export interface LifecycleItem {
  name: string;
  start_date: string;
  end_date: string;
  support_status?: string | null;
  display_name?: string | null;
  major: number;
  minor?: number | null;
  end_date_e4s?: string | null;
  end_date_els?: string | null;
  end_date_eus?: string | null;
}

export const getLifecycle = async (): Promise<RoadmapLifecycleResponse> => {
  const { data } = await axios.get('/api/roadmap/v1/lifecycle/rhel');
  return data;
};
