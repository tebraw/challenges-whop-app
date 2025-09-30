// pages/api/debug/plan-ids.js
export default function handler(req, res) {
  res.json({
    plusPlanId: process.env.NEXT_PUBLIC_PLUS_PLAN_ID,
    proplusPlanId: process.env.NEXT_PUBLIC_PROPLUS_PLAN_ID,
    plusAccessPassId: process.env.NEXT_PUBLIC_PLUS_ACCESS_PASS_ID,
    proplussAccessPassId: process.env.NEXT_PUBLIC_PROPLUS_ACCESS_PASS_ID,
    debug: {
      nodeEnv: process.env.NODE_ENV,
      allNextPublicKeys: Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
    }
  });
}