const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const notificationsTopic = [
  { name: "Local Curiosity Spark", tagName: "local-curiosity-spark" },
  { name: "Curiosity Spark", tagName: "curiosity-spark" },
  { name: "Content & App Updates", tagName: "content-&-app-updates" },
  { name: "Achievement Alerts", tagName: "achievement-alerts" },
];

const localCuriositySparks = [
  {
    title: "Animal Adventures",
    body: "Hey there, little explorer! Ever wondered why some animals hibernate? Ask Eureka to find out!",
  },
  {
    title: "Space Discovery",
    body: "Hi Eureka: What's the largest planet in our solar system? Let's explore space together!",
  },
  {
    title: "Dinosaur Delight",
    body: "Good afternoon! What's your favorite dinosaur? Eureka can tell you some cool facts about them!,",
  },
  {
    title: "Ocean Wonders",
    body: "Dive into the deep blue sea with Eureka. Ask about your favorite ocean creatures!",
  },
  {
    title: "Plant Puzzles",
    body: "Hello, young botanist! Why do leaves change color in the fall? Eureka knows the answer!",
  },
  {
    title: "Weather Watchers",
    body: "What makes a rainbow? Ask Eureka to unravel the mystery of weather and colors.",
  },
  {
    title: "Historical Heroes",
    body: "Hey there, history buff! Who was Cleopatra, and why is she famous? Eureka has the scoop!",
  },
  {
    title: "Earth Explorers",
    body: "Good afternoon! How are mountains formed? Eureka's ready to take you on a geological journey!",
  },
  {
    title: "Amazing Insects",
    body: "Did you know ants can carry objects heavier than themselves? Ask Eureka for more insect facts!",
  },
  {
    title: "Fun with Numbers",
    body: "Hi Eureka: Can you teach me a cool math trick today? Let's make math fun together!",
  },
  {
    title: "Superhero Science",
    body: "Ever wondered how superheroes can fly? Ask Eureka to explore the science behind your favorite ,heroes!",
  },
  {
    title: "Mindful Moments",
    body: "Take a deep breath. Let's learn a calming mindfulness exercise together with Eureka.",
  },
  {
    title: "Fun with Fruits",
    body: "Hello, healthy eater! What's the biggest fruit in the world? Eureka knows all about exotic fruits!",
  },
  {
    title: "Mystery of the Pyramids",
    body: "Hi Eureka: How were the Egyptian pyramids built? Join Eureka's archaeological adventure today!,",
  },
  {
    title: "Musical Magic",
    body: "Do you know why music makes you feel different emotions? Eureka can explain the magic of music,!",
  },
  {
    title: "Space Pioneers",
    body: "Good afternoon! What's a black hole? Ask Eureka for a journey into the mysteries of space.",
  },
  {
    title: "Fun with Science Experiments",
    body: "Get your lab coat ready! Ask Eureka for a fun science experiment you can try at home!",
  },
  {
    title: "Prehistoric Puzzles",
    body: "Hey there, paleontologist in training! What's a fossil, and how is it formed? Eureka knows!",
  },
  {
    title: "Environmental Explorers",
    body: " How can we protect our planet? Eureka has tips on being an eco-friendly explorer!",
  },
];

const createNotificationsTopic = async () => {
    try {
        const result = await prisma.notificationTopic.createMany({
            data: notificationsTopic
        });
        return result;
    } catch (error) {
        console.error("Error creating notification topics:", error);
    }
};

const localCuriositySpark = async () => {
    try {
        const result = await prisma.notificationTopic.findFirst({
            where: {
                tagName: "local-curiosity-spark"
            }
        });
        return result;
    } catch (error) {
        console.error("Error fetching local curiosity spark:", error);
    }
}

const createLocalCuriositySpark = async (curiosityId) => {
    for (const loc of localCuriositySparks) {
        console.log(loc);
        try {
            await prisma.notifications.create({
                data: {
                    title: loc.title,
                    body: loc.body,
                    notificationTopicId: curiosityId,
                },
            });
        } catch (error) {
            console.error("Error creating local curiosity spark:", error);
        }
    }
}

(async () => {
    await createNotificationsTopic();
    const local = await localCuriositySpark();
    if (local) {
        await createLocalCuriositySpark(local.id);
    }
})();
