export interface Sample {
  label: string;
  data: string;
}

export const SAMPLES: Sample[] = [
  {
    label: "E-commerce Sales",
    data: `date,product,category,revenue,units,region,return_rate
2024-01-01,Widget A,Electronics,4200,42,North,0.02
2024-01-01,Gadget B,Electronics,8900,89,South,0.05
2024-01-02,Widget A,Electronics,3100,31,East,0.01
2024-01-03,Gizmo C,Home,1200,24,West,0.08
2024-01-04,Gadget B,Electronics,12400,124,North,0.03
2024-01-05,Widget A,Electronics,2800,28,South,0.02
2024-01-06,Gizmo C,Home,900,18,East,0.12
2024-01-07,Gadget B,Electronics,15600,156,West,0.04
2024-01-08,Widget D,Clothing,3400,68,North,0.15
2024-01-09,Widget A,Electronics,5100,51,South,0.01`,
  },
  {
    label: "Employee HR Data",
    data: `employee_id,department,salary,tenure_years,performance_score,remote_days,satisfaction
E001,Engineering,95000,3,4.2,3,8.1
E002,Marketing,72000,7,3.8,2,6.4
E003,Engineering,110000,5,4.8,4,9.2
E004,Sales,68000,1,3.1,0,5.0
E005,Engineering,88000,2,4.0,3,7.8
E006,HR,61000,9,3.5,1,6.9
E007,Sales,74000,4,4.3,0,7.1
E008,Marketing,79000,6,4.1,2,7.5
E009,Engineering,105000,8,4.6,5,8.8
E010,Sales,55000,0,2.9,0,4.2`,
  },
  {
    label: "Website Analytics",
    data: `date,page,sessions,bounce_rate,avg_duration_sec,conversions,traffic_source
2024-01-01,/home,4521,0.42,145,89,organic
2024-01-01,/pricing,1203,0.28,312,145,paid
2024-01-02,/home,3987,0.45,132,72,organic
2024-01-02,/blog/ai-trends,2341,0.61,89,12,social
2024-01-03,/pricing,1567,0.25,298,178,paid
2024-01-03,/home,5102,0.38,158,104,email
2024-01-04,/docs,891,0.55,421,8,organic
2024-01-04,/pricing,1890,0.22,345,221,paid
2024-01-05,/blog/ai-trends,3120,0.58,95,18,social
2024-01-05,/home,4234,0.41,149,91,organic`,
  },
];
