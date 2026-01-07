import {
  getNotionClient,
  getNotionDatabaseId,
} from '@/infrastructure/notion/notion.client';
import { isFullDatabase, isFullPage } from '@notionhq/client';
import { NextResponse } from 'next/server';

/**
 * GET /api/notion/test
 * Notion API 연동 테스트
 * 데이터베이스 정보 및 페이지 목록 일부 반환
 *
 * Notion SDK v5 (API 2025-09-03): dataSources.query 사용
 */
export async function GET() {
  try {
    const notion = getNotionClient();
    const dataSourceId = getNotionDatabaseId();

    // 데이터베이스 정보 조회
    const database = await notion.databases.retrieve({
      database_id: dataSourceId,
    });

    // 페이지 목록 조회 (최대 10개)
    // SDK v5: dataSources.query 사용 (database_id → data_source_id)
    const pagesResponse = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 10,
    });

    // 타입 가드를 사용한 안전한 접근
    const databaseInfo = isFullDatabase(database)
      ? {
          id: database.id,
          title: database.title[0]?.plain_text ?? 'Untitled',
          dataSources: database.data_sources.length,
        }
      : {
          id: database.id,
          title: 'Partial Database',
          dataSources: 0,
        };

    const pages = pagesResponse.results.filter(isFullPage).map((page) => ({
      id: page.id,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
    }));

    return NextResponse.json({
      success: true,
      database: databaseInfo,
      pages: {
        count: pages.length,
        hasMore: pagesResponse.has_more,
        items: pages,
      },
    });
  } catch (error) {
    console.error('Notion API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
