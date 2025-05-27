
const { PrismaClient, TrialPeriod, PlanType } = require('@prisma/client');
const prisma = new PrismaClient();

const plans = [
    {
        name: "Mini",
        description: "Monthly Plan,250 Questions",
        type: PlanType.MONTHLY,
        trialPeriod: TrialPeriod.THREEDAYS,
    },
    {
        name: "Mini",
        description: "Yearly Plan,250 Questions/month",
        type: PlanType.YEARLY,
        trialPeriod: TrialPeriod.SEVENDAYS 
    },
    {
        name: "Solo",
        description: "1 Profile,1000 Questions,100 Stories",
        type: PlanType.MONTHLY,
    },
    {
        name: "Solo",
        description: "1 Profile,1000 Questions per month,100 Stories per month",
        type: PlanType.YEARLY,
    },
    {
        name: "Family",
        description: "Multi Profiles,2000 Questions,200 Stories",
        type: PlanType.MONTHLY,
    },
    {
        name: "Family",
        description: "Multi Profiles,2000 Questions per month,200 Stories per month",
        type: PlanType.YEARLY,
    },
  ];

const createPlans = async () => {
    plans.map(async(plan) => {
        const newPlan = await prisma.plan.create({
            data: plan,
        });
        console.log(newPlan);
    })
};

createPlans();