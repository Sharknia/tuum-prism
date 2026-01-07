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
 * Notion SDK v5 (API 2025-09-03):
 * - databases.retrieve(database_id) → data_sources 배열 포함
 * - dataSources.query(data_source_id) → 실제 페이지 조회
 */
export async function GET() {
  try {
    const notion = getNotionClient();
    const databaseId = getNotionDatabaseId();

    // 1. 데이터베이스 정보 조회 (database_id 사용)
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });

    // 2. data_source_id 추출
    if (!isFullDatabase(database)) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve full database' },
        { status: 500 }
      );
    }

    const dataSourceId = database.data_sources[0]?.id;
    if (!dataSourceId) {
      return NextResponse.json(
        { success: false, error: 'No data sources found in database' },
        { status: 500 }
      );
    }

    // 3. 데이터 소스 스키마 조회 (properties 포함)
    const dataSource = await notion.dataSources.retrieve({
      data_source_id: dataSourceId,
    });

    // 4. 페이지 목록 조회 (data_source_id 사용)
    const pagesResponse = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 10,
    });

    const databaseInfo = {
      id: database.id,
      title: database.title[0]?.plain_text ?? 'Untitled',
      dataSourceId: dataSourceId,
      dataSourcesCount: database.data_sources.length,
    };

    // 스키마(properties) 추출
    const schema =
      'properties' in dataSource
        ? Object.entries(
            dataSource.properties as Record<string, { type: string }>
          ).map(([name, prop]) => ({
            name,
            type: prop.type,
          }))
        : [];

    const pages = pagesResponse.results.filter(isFullPage).map((page) => ({
      id: page.id,
      createdTime: page.created_time,
      lastEditedTime: page.last_edited_time,
    }));

    return NextResponse.json({
      success: true,
      database: databaseInfo,
      schema,
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
