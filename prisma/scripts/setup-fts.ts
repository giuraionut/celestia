import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupFTS() {
  try {
    console.log('Setting up FTS for posts...');

    // Step 1: Create the FTS5 virtual table using plainTextContent instead of content
    await prisma.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE IF NOT EXISTS PostFTS USING fts5(
        id,
        title,
        plainTextContent,
        tokenize='porter unicode61'
      );
    `);
    console.log('✅ FTS5 virtual table created');

    // Step 2: Drop existing triggers if they exist
    const triggers = ['post_ai', 'post_au', 'post_ad'];
    for (const trigger of triggers) {
      try {
        await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trigger};`);
      } catch (e: unknown) {
        console.log(`Note: Could not drop trigger ${trigger}: ${(e as Error).message}`);
      }
    }
    console.log('✅ Checked existing triggers');

    // Step 3: Create insert trigger to index the new plainTextContent field
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER post_ai AFTER INSERT ON Post
      WHEN NEW.isDeleted = 0
      BEGIN
        INSERT INTO PostFTS(id, title, plainTextContent)
        VALUES (NEW.id, NEW.title, NEW.plainTextContent);
      END;
    `);
    console.log('✅ Insert trigger created');

    // Step 4: Create update triggers
    // Trigger for when a post is marked as deleted
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER post_au_delete AFTER UPDATE ON Post
      WHEN NEW.isDeleted = 1 AND OLD.isDeleted = 0
      BEGIN
        DELETE FROM PostFTS WHERE id = OLD.id;
      END;
    `);

    // Trigger for when the title or plainTextContent is updated
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER post_au_content AFTER UPDATE ON Post
      WHEN NEW.isDeleted = 0 AND (OLD.title != NEW.title OR OLD.plainTextContent != NEW.plainTextContent)
      BEGIN
        UPDATE PostFTS SET title = NEW.title, plainTextContent = NEW.plainTextContent WHERE id = NEW.id;
      END;
    `);
    console.log('✅ Update triggers created');

    // Step 5: Create delete trigger
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER post_ad AFTER DELETE ON Post
      BEGIN
        DELETE FROM PostFTS WHERE id = OLD.id;
      END;
    `);
    console.log('✅ Delete trigger created');

    // Step 6: Populate with existing data using plainTextContent
    await prisma.$executeRawUnsafe(`DELETE FROM PostFTS;`);
    await prisma.$executeRawUnsafe(`
      INSERT INTO PostFTS(id, title, plainTextContent)
      SELECT id, title, plainTextContent FROM Post WHERE isDeleted = 0;
    `);
    console.log('✅ Existing data indexed');

    console.log('FTS setup completed successfully! 🎉');
    
    // Optional: Test the search functionality
    const searchTerm = 'test';
    const results = await prisma.$queryRawUnsafe(`
      SELECT Post.* FROM Post
      JOIN PostFTS ON Post.id = PostFTS.id
      WHERE PostFTS MATCH ?
      ORDER BY rank
      LIMIT 10
    `, `${searchTerm}*`);
    
    console.log(`Test search for "${searchTerm}*" returned ${Array.isArray(results) ? results.length : 0} results`);
    
  } catch (error) {
    console.error('Error setting up FTS:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupFTS().catch(e => {
  console.error(e);
  process.exit(1);
});
